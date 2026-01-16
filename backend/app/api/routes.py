"""API routes for the application."""

import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import FileResponse

from app.models import (
    VoiceProfile,
    GenerationRequest,
    GenerationResponse,
    AudioRecording,
    VoiceType,
    AudioLibraryResponse,
    TaskStatus,
    TaskResponse,
    ScriptOptimizationRequest,
)
from app.services import VoiceService, AudioService, LLMService
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

voice_service = VoiceService()
audio_service = AudioService()
llm_service = LLMService()


# In-memory task store
tasks: dict[str, dict] = {}

def process_generation(task_id: str, request: GenerationRequest):
    """Background task wrapper for generation."""
    try:
        tasks[task_id]["status"] = TaskStatus.PROCESSING
        print(f"\n--- [Backend] Starting background generation task: {task_id} ---")
        
        # Get voice profile
        voice_profile = voice_service.get_voice_profile(request.voice_id)
        voice_name = voice_profile.name if voice_profile else "unknown"

        # Generate speech (Heavy CPU task)
        # Note: run_in_threadpool is handled automatically by FastAPI BackgroundTasks for sync functions,
        # but here we are calling sync function inside a sync wrapper.
        # Ideally, we should confirm voice_service.generate_speech is blocking. 
        # Since it is, running it here in background task (which runs in threadpool) is correct.
        
        gen_result = voice_service.generate_speech(
            text=request.text,
            voice_id=request.voice_id,
            num_speakers=request.num_speakers,
            cfg_scale=request.cfg_scale,
            guest_voice_id=request.guest_voice_id,
            speed=request.speed,
            pitch=request.pitch,
        )

        if gen_result is None:
             tasks[task_id]["status"] = TaskStatus.FAILED
             tasks[task_id]["error"] = "Speech generation failed"
             return

        audio_array, actual_sr = gen_result

        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if request.custom_filename:
            base_name = request.custom_filename
            if base_name.lower().endswith(".wav"):
                base_name = base_name[:-4]
            filename = f"{base_name}.wav"
        else:
            filename = f"{voice_name}_{timestamp}.wav"

        filepath = audio_service.save_audio(audio_array, filename=filename, sample_rate=actual_sr)
        logger.info(f"Saved generated audio to: {filepath} at {actual_sr}Hz")

        # Duration - ensure we use float for precision
        duration = float(len(audio_array)) / actual_sr
        
        # Double check duration against file if it looks suspicious
        if duration < 0.1:
            try:
                import soundfile as sf
                info = sf.info(filepath)
                duration = info.duration
                logger.info(f"Corrected duration from file info: {duration}")
            except Exception as e:
                logger.warning(f"Could not verify duration from file: {e}")

        # Save metadata
        audio_service.save_audio_metadata(
            filename, voice_name, duration, request.text[:100]
        )
        
        # Prepare success result
        result = GenerationResponse(
            success=True,
            audio_url=f"/api/audio/{filename}",
            filename=filename,
            duration=duration,
            message="Audio generated successfully",
        )
        
        tasks[task_id]["status"] = TaskStatus.COMPLETED
        tasks[task_id]["result"] = result
        print(f"--- [Backend] Task {task_id} completed successfully ---")

    except Exception as e:
        logger.error(f"Background generation error: {e}")
        tasks[task_id]["status"] = TaskStatus.FAILED
        tasks[task_id]["error"] = str(e)

@router.get("/voices", response_model=List[VoiceProfile])
async def get_voices(search: Optional[str] = Query(None)):
    """Get all voice profiles with optional search."""
    voices = voice_service.get_voice_profiles()

    if search:
        search_lower = search.lower()
        voices = [v for v in voices if search_lower in v.name.lower()]

    return voices


@router.delete("/voices/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete a voice profile."""
    try:
        success = voice_service.delete_voice_profile(voice_id)
        if success:
            return {"success": True, "message": "Voice deleted successfully"}
        else:
            raise HTTPException(404, "Voice not found")
    except Exception as e:
        logger.error(f"Failed to delete voice: {e}")
        raise HTTPException(500, f"Failed to delete voice: {str(e)}")


@router.post("/voices/upload")
async def upload_voice(file: UploadFile = File(...), name: str = Form(...)):
    try:
        print(f"\n--- [Backend] Received upload request for voice: {name} ---")
        logger.info(f"Uploading voice: {name}, file: {file.filename}")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.SUPPORTED_FORMATS:
            raise HTTPException(
                400, f"Unsupported format. Use: {settings.SUPPORTED_FORMATS}"
            )

        content = await file.read()
        size = len(content)
        max_size = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
        if size > max_size:
            raise HTTPException(
                400, f"File too large. Max {settings.MAX_AUDIO_SIZE_MB}MB"
            )

        # save raw
        raw_path = settings.VOICES_DIR / f"{name}_{uuid.uuid4().hex[:8]}{file_ext}"
        settings.VOICES_DIR.mkdir(exist_ok=True, parents=True)
        with open(raw_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved voice file to: {raw_path}")

        # convert to wav if needed
        final_path = raw_path
        if file_ext != ".wav":
            wav_path = raw_path.with_suffix(".wav")
            audio_service.convert_to_wav(str(raw_path), str(wav_path))
            try:
                os.remove(raw_path)
            except Exception:
                pass
            final_path = wav_path
            logger.info(f"Converted to WAV: {final_path}")

        profile = await voice_service.enroll_voice(
            name=name,
            audio_path=str(final_path),
            voice_type=VoiceType.UPLOADED,
        )
        return {
            "success": True,
            "voice": profile,
            "message": "Voice uploaded and enrolled successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.get("/voices/{voice_id}/sample")
async def get_voice_sample(voice_id: str):
    """Get the audio sample file for a voice."""
    logger.info(f"Requesting sample for voice_id: {voice_id}")
    
    profile = voice_service.get_voice_profile(voice_id)
    if not profile:
        logger.error(f"Voice profile not found for id: {voice_id}")
        raise HTTPException(404, "Voice not found")
    
    if not profile.file_path:
        logger.warning(f"No sample file path defined for voice: {voice_id}")
        raise HTTPException(404, "No sample available for this voice")

    file_path = Path(profile.file_path)
    if not file_path.exists():
         logger.warning(f"Path does not exist: {file_path}")
         # Fallback check if it's relative to VOICES_DIR
         file_path = settings.VOICES_DIR / Path(profile.file_path).name 
         logger.info(f"Trying fallback path: {file_path}")
         
    if not file_path.exists() or not file_path.is_file():
        logger.error(f"Audio file missing or not a file on disk at: {file_path}")
        raise HTTPException(404, "Audio file missing on disk")

    return FileResponse(file_path, media_type="audio/wav")


@router.post("/voices/record")
async def record_voice(recording: AudioRecording):
    """Save a recorded voice sample reliably (handles webm/mp4/ogg)."""
    try:
        logger.info(f"Saving recorded voice: {recording.name}")

        # Use container extension from client format; default webm
        ext = (recording.format or "webm").lower().lstrip(".")
        raw_path = (
            settings.VOICES_DIR / f"{recording.name}_{uuid.uuid4().hex[:8]}.{ext}"
        )

        # Write raw and convert to wav
        wav_path = audio_service.base64_to_audio(
            base64_data=recording.audio_data,
            output_path=raw_path,
            format=ext,
        )
        logger.info(f"Saved recording to: {wav_path}")

        profile = voice_service.add_voice_profile(
            name=recording.name,
            audio_path=wav_path,
            voice_type=VoiceType.RECORDED,
        )
        return {
            "success": True,
            "voice": profile,
            "message": "Recording saved successfully",
        }

    except Exception as e:
        logger.error(f"Recording error: {e}")
        raise HTTPException(500, f"Recording failed: {str(e)}")


@router.post("/generate", response_model=TaskResponse)
async def generate_speech(request: GenerationRequest, background_tasks: BackgroundTasks):
    try:
        print(f"\n--- [Backend] Received Generation Request ---")
        print(f"Text length: {len(request.text)}")
        # Removed Speed/Pitch logs as requested
        
        task_id = uuid.uuid4().hex
        tasks[task_id] = {
            "task_id": task_id,
            "status": TaskStatus.PENDING,
            "created_at": datetime.now(),
            "result": None,
            "error": None
        }
        
        background_tasks.add_task(process_generation, task_id, request)
        
        return TaskResponse(
            task_id=task_id,
            status=TaskStatus.PENDING
        )

    except Exception as e:
        logger.error(f"Generation request error: {e}")
        raise HTTPException(500, f"Failed to start generation: {str(e)}")


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(404, "Task not found")
    
    task_data = tasks[task_id]
    return TaskResponse(**task_data)


@router.post("/generate/file")
async def generate_from_file(
    file: UploadFile = File(...),
    voice_id: str = Form(...),
    cfg_scale: float = Form(1.3),
):
    try:
        content = await file.read()
        text = content.decode("utf-8")
        logger.info(f"Generating from file: {file.filename}, text length: {len(text)}")
        req = GenerationRequest(text=text, voice_id=voice_id, cfg_scale=cfg_scale)
        return await generate_speech(req)
    except Exception as e:
        logger.error(f"File generation error: {e}")
        raise HTTPException(500, f"Generation failed: {str(e)}")


@router.post("/generate/script")
async def generate_script(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    host_name: str = Form("Host"),
    guest_name: str = Form("Guest"),
    mode: str = Form("solo"),
    style: str = Form("Deep Dive"),
    language: str = Form("Chinese"),
    n_rounds: int = Form(5),
):
    try:
        logger.info(f"Generating script (mode={mode}, style={style}, lang={language})")
        if not text and not file:
            raise HTTPException(400, "Either text or file must be provided")

        context = text or ""
        if file:
            try:
                filename = file.filename
                # Generate timestamped filename
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                file_path = Path(file.filename)
                saved_filename = f"{file_path.stem}_{timestamp}{file_path.suffix}"
                save_path = settings.UPLOADS_DIR / saved_filename
                
                # Reset file pointer and read bytes
                await file.seek(0)
                content_bytes = await file.read()
                
                # Save to uploads directory
                with open(save_path, "wb") as f:
                    f.write(content_bytes)
                logger.info(f"Saved uploaded analysis file to: {save_path}")
                print(f"\n--- [Backend] Saved analysis file: {saved_filename} ---")

                file_text = ""
                # Process the content based on extension
                lower_filename = filename.lower()
                if lower_filename.endswith(".pdf"):
                    import io
                    from pypdf import PdfReader
                    pdf = PdfReader(io.BytesIO(content_bytes))
                    for i, page in enumerate(pdf.pages):
                        try:
                            file_text += page.extract_text() + "\n"
                        except Exception as page_err:
                            logger.warning(f"Could not extract text from PDF page {i}: {page_err}")
                            continue
                elif lower_filename.endswith(".docx"):
                    import io
                    from docx import Document
                    doc = Document(io.BytesIO(content_bytes))
                    for para in doc.paragraphs:
                        file_text += para.text + "\n"
                else:
                    # Fallback for text files
                    file_text = content_bytes.decode("utf-8", errors="ignore")

                context += "\n\n[Attached File Content]:\n" + file_text
            except Exception as e:
                logger.warning(f"Failed to process file content: {e}")
                raise HTTPException(400, f"Error processing file: {str(e)}")

        script = llm_service.generate_podcast_script(
            context_text=context,
            host_name=host_name,
            guest_name=guest_name,
            mode=mode,
            style=style,
            language=language,
            n_rounds=n_rounds,
        )

        return {"success": True, "script": script}
    except Exception as e:
        logger.error(f"Script generation error: {e}")
        raise HTTPException(500, f"Script generation failed: {str(e)}")


@router.post("/optimize-script")
async def optimize_script(request: ScriptOptimizationRequest):
    try:
        logger.info(f"Optimizing script with {len(request.script)} lines")
        # Convert Pydantic models to dicts for the service
        script_dicts = [line.dict() for line in request.script]
        
        optimized_dicts = llm_service.optimize_script_emotions(script_dicts)
        
        return {"success": True, "script": optimized_dicts}
    except Exception as e:
        logger.error(f"Script optimization error: {e}")
        raise HTTPException(500, f"Script optimization failed: {str(e)}")


@router.get("/audio/library", response_model=AudioLibraryResponse)
async def get_audio_library(search: Optional[str] = Query(None)):
    """Get all generated audio files with metadata."""
    try:
        audio_files = audio_service.get_audio_library(search)
        return AudioLibraryResponse(
            success=True, audio_files=audio_files, total=len(audio_files)
        )
    except Exception as e:
        logger.error(f"Failed to get audio library: {e}")
        return AudioLibraryResponse(
            success=False, audio_files=[], total=0, message=str(e)
        )


@router.delete("/audio/{filename}")
async def delete_audio(filename: str):
    """Delete a generated audio file."""
    try:
        filepath = settings.OUTPUTS_DIR / filename
        if not filepath.exists():
            raise HTTPException(404, "Audio file not found")

        os.remove(filepath)

        # Also remove metadata file if exists
        metadata_file = filepath.with_suffix(".json")
        if metadata_file.exists():
            os.remove(metadata_file)

        return {"success": True, "message": "Audio deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete audio: {e}")
        raise HTTPException(500, f"Failed to delete audio: {str(e)}")


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    filepath = settings.OUTPUTS_DIR / filename
    if not filepath.exists():
        raise HTTPException(404, "Audio file not found")
    
    # RFC 5987: filename*=utf-8''encoded_filename
    encoded_filename = quote(filename)
    return FileResponse(
        filepath,
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"},
    )


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": voice_service.is_model_loaded(),
    }
