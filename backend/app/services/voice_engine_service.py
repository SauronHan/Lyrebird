import sys
import os
import re
import logging
import uuid
import torch
import numpy as np
import soundfile as sf
from typing import Optional, List, Dict, Generator
from pathlib import Path

# Enable MPS fallback for unimplemented operators on Mac
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

from app.config import settings
from app.models import VoiceProfile

logger = logging.getLogger(__name__)

class LocalLyrebirdService:
    """Service for Local CosyVoice inference using the official codebase."""

    def __init__(self):
        self.model_dir = str(settings.MODEL_DIR)
        self.base_dir = str(settings.Lyrebird_BASE_DIR)
        self.model = None
        
        # Ensure Lyrebird code is in python path
        self._setup_path() # setup path first
        self._load_model()

    def _setup_path(self):
        """Add CosyVoice repo to sys.path."""
        if self.base_dir not in sys.path:
            logger.info(f"Adding {self.base_dir} to sys.path")
            sys.path.append(self.base_dir)
        
        # Also need Matcha-TTS for some components if used
        matcha_path = os.path.join(self.base_dir, "third_party", "Matcha-TTS")
        if matcha_path not in sys.path and os.path.exists(matcha_path):
             sys.path.append(matcha_path)

    def _load_model(self):
        """Load the CosyVoice model."""
        logger.info(f"Checking model directory: {self.model_dir}")
        if not os.path.exists(self.model_dir):
            logger.error(f"FATAL: Model directory DOES NOT exist: {self.model_dir}")
            # List parent directory to see what's there
            parent = os.path.dirname(self.model_dir)
            if os.path.exists(parent):
                logger.info(f"Contents of {parent}: {os.listdir(parent)}")
            return

        # Check for essential files
        required_files = ['cosyvoice3.yaml', 'llm.pt', 'flow.pt', 'hift.pt']
        missing = [f for f in required_files if not os.path.exists(os.path.join(self.model_dir, f))]
        if missing:
            logger.warning(f"Warning: Missing expected files in model dir: {missing}")
            # Also check if they are in a subfolder (sometimes ModelScope adds a nesting layer)
            logger.info(f"Model dir contents: {os.listdir(self.model_dir)}")

        try:
            logger.info(f"Loading Local CosyVoice model from {self.model_dir}...")
            # Late import to avoid import errors
            from cosyvoice.cli.cosyvoice import AutoModel
            
            logger.info("AutoModel imported. Initializing...")
            # Use AutoModel to automatically detect model version (Lyrebird, Lyrebird2, Lyrebird3)
            # NOTE: Lyrebird3 does not support load_jit parameter in its constructor.
            # Enable fp16 for MPS/CUDA acceleration
            self.model = AutoModel(
                model_dir=self.model_dir, 
                load_trt=False, 
                fp16=True
            )
            logger.info(f"SUCCESS: Local CosyVoice model loaded. Type: {type(self.model)}")

        except ImportError as ie:
            logger.error(f"CRITICAL: Dependency missing during local CosyVoice load: {ie}", exc_info=True)
        except Exception as e:
            logger.error(f"ERROR: Failed to load local CosyVoice model: {str(e)}", exc_info=True)
            # Print more environment info
            logger.info(f"Python path: {sys.path}")
            logger.info(f"Current working directory: {os.getcwd()}")

    def get_preset_voices(self) -> List[VoiceProfile]:
        """Return list of preset voices available in the model."""
        if not self.model:
            return []
        
        try:
            spks = self.model.list_available_spks()
            profiles = []
            for spk in spks:
                profiles.append(VoiceProfile(
                    id=spk,
                    name=spk,
                    type="preset",
                    file_path="" # Presets don't have a single file path usually
                ))
            return profiles
        except Exception as e:
            logger.error(f"Error listing preset voices: {e}")
            return []

    def generate_audio(
        self,
        text: str,
        voice_id: str,
        voice_profile: Optional[VoiceProfile] = None,
        guest_voice_profile: Optional[VoiceProfile] = None,
        speed: float = 1.0,
        pitch: float = 1.0, # Note: CosyVoice main API might not support pitch directly in inference_zero_shot yet without sft
        emotion: str = "neutral" 
    ) -> Optional[np.ndarray]:
        """
        Generate audio using Local CosyVoice.
        """
        if not self.model:
            logger.error("Model not loaded.")
            return None

        try:
            # Parse text for multi-speaker check
            # Pattern: "Speaker 0: Text..."
            parsed_segments = []
            
            # Simple check if "Speaker" tag exists
            if "Speaker " in text and ":" in text:
                lines = text.split('\n')
                current_speaker = None
                current_text = []

                for line in lines:
                    match = re.search(r'^Speaker (\d+):\s*(.*)', line)
                    if match:
                        # Save previous segment if exists
                        if current_speaker is not None and current_text:
                            parsed_segments.append((current_speaker, "\n".join(current_text)))
                        
                        current_speaker = int(match.group(1))
                        current_text = [match.group(2).strip()]
                    else:
                        current_text.append(line)
                
                # Append the last segment
                if current_speaker is not None and current_text:
                    parsed_segments.append((current_speaker, "\n".join(current_text)))
            
            # Fallback if no valid parsing happened or plain text
            if not parsed_segments:
                parsed_segments.append((0, text)) # Default to speaker 0 (Host)

            
            full_audio_list = []
            
            for spk_id, segment_text in parsed_segments:
                if not segment_text.strip():
                    continue

                # Clean unstable tags that might cause crashes in zero-shot mode
                segment_text = segment_text.replace("<strong>", "").replace("</strong>", "")

                # Advanced CosyVoice 3.0 Processing: Multi-tag Splitting
                emotion_map = {
                    "happy": "说话者语气充满快乐和兴奋，声音欢快，语调上扬，带有明显的笑意，语速适中。",
                    "sad": "说话者语气非常悲伤，声音低沉，语速缓慢，带有哽咽或叹息的感觉。",
                    "angry": "说话者非常愤怒，声音紧绷有力，语速较快，语气强烈不满。",
                    "fearful": "说话者感到恐惧和紧张，声音颤抖，呼吸急促，语速不稳定。",
                    "surprised": "说话者感到非常惊讶，难以置信，语调极高，带有强烈的疑问感。",
                    "disgusted": "说话者语气充满厌恶和不屑，声音冷淡，强调重读，带有排斥感。",
                    "neutral": "说话者语气平和自然，情绪稳定，像日常交谈一样放松。",
                    "whisper": "说话者在轻声耳语，声音极低，气息感强，像在说秘密。",
                    "affectionate": "说话者语气温柔深情，声音柔软，带有关切和爱意，语速舒缓。",
                    "serious": "说话者语气严肃认真，沉着冷静，声音笃定，语速适中，不带玩笑成分。",
                    "fast": "说话者语速非常快，情绪激动或着急。",
                    "slow": "说话者语速很慢，从容不迫或犹豫不决。",
                    "high_pitch": "说话者音调很高，情绪高昂。",
                    "low_pitch": "说话者音调很低，深沉稳重。"
                }

                # 1. Split segment into sub-chunks by XML tags
                sub_chunks = []
                tag_pattern = r"<([a-zA-Z_]+)>(.*?)</\1>"
                matches = list(re.finditer(tag_pattern, segment_text, re.DOTALL))
                
                if matches:
                    last_end = 0
                    for match in matches:
                        # Plain text before tag
                        pre = segment_text[last_end:match.start()].strip()
                        if pre: sub_chunks.append(("neutral", pre))
                        
                        # Tagged content
                        sub_chunks.append((match.group(1).lower(), match.group(2).strip()))
                        last_end = match.end()
                    # Remaining text
                    post = segment_text[last_end:].strip()
                    if post: sub_chunks.append(("neutral", post))
                else:
                    # Fallback for old style prefix or plain text
                    old_prefix = re.match(r"\s*你说话的情感是\s*([a-zA-Z]+)[。！!\.]?\s*(.*)", segment_text, re.DOTALL)
                    if old_prefix:
                        sub_chunks.append((old_prefix.group(1).lower(), old_prefix.group(2).strip()))
                    else:
                        sub_chunks.append(("neutral", segment_text))

                segment_audio_parts = []
                
                # 2. Process each sub-chunk
                for tag, chunk_text in sub_chunks:
                    # CRITICAL FIX: Strip all tags and whitespace for validation
                    # If the text is empty or just punctuation/tags, skip it to avoid model crashes
                    clean_content = re.sub(r"</?[a-zA-Z_]+>", "", chunk_text).strip()
                    if not clean_content:
                        continue
                        
                    # Prepare instruction
                    inst_body = emotion_map.get(tag, f"用{tag}的语气")
                    # Use official prefix and suffix for stability
                    instruct_text = f"You are a helpful assistant. {inst_body}<|endofprompt|>"
                    
                    logger.info(f"Synthesizing sub-chunk ({tag}): {clean_content[:30]}...")

                    try:
                        # Determine profile
                        active_profile = voice_profile if spk_id == 0 else (guest_voice_profile or voice_profile)
                        
                        # Generate
                        chunk_output = []
                        if active_profile and active_profile.file_path and hasattr(self.model, 'inference_instruct2'):
                             # Use instruct mode for all chunks to maintain consistency
                             chunk_output = list(self.model.inference_instruct2(
                                 tts_text=clean_content,
                                 instruct_text=instruct_text,
                                 prompt_wav=active_profile.file_path,
                                 speed=speed
                             ))
                        elif active_profile and active_profile.type == "preset":
                             # Fallback for presets
                             if hasattr(self.model, 'inference_instruct'):
                                 chunk_output = list(self.model.inference_instruct(clean_content, active_profile.id, instruct_text, speed=speed))
                             else:
                                 chunk_output = list(self.model.inference_sft(clean_content, active_profile.id, speed=speed))
                        else:
                             # Plain synthesis fallback
                             if active_profile and active_profile.file_path:
                                 chunk_output = list(self.model.inference_cross_lingual(clean_content, active_profile.file_path, speed=speed))
                             elif active_profile:
                                 chunk_output = list(self.model.inference_sft(clean_content, active_profile.id, speed=speed))

                        for o in chunk_output:
                            if 'tts_speech' in o:
                                segment_audio_parts.append(o['tts_speech'].numpy())
                    except Exception as chunk_err:
                        logger.error(f"Error synthesizing sub-chunk: {chunk_err}")
                        continue

                if segment_audio_parts:
                    segment_audio = np.concatenate(segment_audio_parts, axis=1) # (1, samples)
                    full_audio_list.append(segment_audio.squeeze())
                
                continue # Skip the old loop body

            # Original loop body for non-instructed or fallback flows (not reached if continue used)
            for spk_id, segment_text in parsed_segments:
                # ... this part is technically shadowed by the logic above now but kept as backup ...
                pass
            
            if not full_audio_list:
                return None
                
            # Concatenate all segments
            final_audio = np.concatenate(full_audio_list)
            
            logger.info(f"Generation complete. Final Shape: {final_audio.shape}, Sample Rate: {self.model.sample_rate}")
            return final_audio

        except Exception as e:
            logger.error(f"Local generation error: {e}", exc_info=True)
            return None

    def enroll_voice(self, audio_url: str, prefix: Optional[str] = None) -> Optional[str]:
        """
        Local enrollment just means verifying the file exists and is usable.
        We don't need to do anything complex for 'Cross-Lingual' inference since it takes WAV path directly.
        But to be compatible with 'Zero-Shot' (which requires prompt text), we would need ASR.
        For now, we support 'Cross-Lingual' style cloning which is 'Prompt Audio' driven.
        
        The 'audio_url' here from existing logic might be a URL or a Path.
        In local mode, we expect a Path string.
        """
        # In local mode, 'enrollment' is virtual. We just return a success ID.
        # The actual 'profile' with file_path is stored by VoiceService.
        # We can just return a UUID.
        return f"local-{uuid.uuid4().hex[:8]}"

