import os
import logging
from typing import Optional, List, Dict
import uuid
import numpy as np

from app.config import settings
from app.models import VoiceProfile, VoiceType

logger = logging.getLogger(__name__)

class VoiceService:
    """Service for voice synthesis operations using Lyrebird."""

    def __init__(self):
        """Initialize the voice service with Local Lyrebird."""
        from app.services.voice_engine_service import LocalLyrebirdService
        self.service = LocalLyrebirdService()
        logger.info("VoiceService initialized with Local Lyrebird Backend.")
            
        self.voices_cache: Dict[str, VoiceProfile] = {}
        # Load local custom voices (uploaded by user)
        self._load_local_voices()

    def _load_local_voices(self):
        """Load available voice profiles from the voices directory."""
        settings.VOICES_DIR.mkdir(exist_ok=True)

        voice_files = []
        for ext in ("*.wav", "*.mp3", "*.m4a", "*.flac", "*.ogg"):
            voice_files.extend(settings.VOICES_DIR.glob(ext))

        for voice_file in voice_files:
            # We use filename stem as ID if it looks like a UUID, or generate one?
            # Existing logic was generating new UUID every start which is bad for persistence if ID matters.
            # But the file saving logic in routes appends UUID to filename.
            # Let's try to preserve ID if possible, or just generate new one for session.
            # The current file naming convention in routes is: "{name}_{uuid}.{ext}"
            # We can parse it? For now, let's stick to existing behavior: generate ID for session map.
            # Generate consistent ID from filename to persist selection across restarts
            # Filename format is usually: "{name}_{uuid_short}.{ext}" or just "{name}.{ext}"
            # We use the filename stem as the unique ID.
            voice_id = voice_file.stem
            profile = VoiceProfile(
                id=voice_id,
                name=voice_file.stem, # This might include the appended UUID
                type=VoiceType.RECORDED if "record" in voice_file.name else VoiceType.UPLOADED,
                file_path=str(voice_file),
            )
            self.voices_cache[voice_id] = profile
            logger.info(f"Loaded local voice: {voice_file.stem}")

    def generate_speech(
        self,
        text: str,
        voice_id: str,
        num_speakers: int = 1,
        cfg_scale: float = 1.3, # Deprecated but kept for signature compatibility
        guest_voice_id: Optional[str] = None,
        speed: float = 1.0, # New
        pitch: float = 1.0, # New
    ) -> Optional[tuple[np.ndarray, int]]:
        """
        Generate speech from text using Lyrebird.
        Returns Tuple of (audio_array, sample_rate)
        """
        try:

            # Check if it's a preset voice from Lyrebird
            preset_voices = self.service.get_preset_voices()
            target_profile = None
            
            # 1. Search in local cache (Uploaded/Cloned voices)
            if voice_id in self.voices_cache:
                target_profile = self.voices_cache[voice_id]
            else:
                # 2. Search in presets
                for v in preset_voices:
                    if v.id == voice_id:
                        target_profile = v
                        break
            
            if not target_profile:
                logger.error(f"Voice {voice_id} not found.")
                return None

            # Resolve Guest Profile if needed
            guest_profile = None
            if guest_voice_id:
                if guest_voice_id in self.voices_cache:
                    guest_profile = self.voices_cache[guest_voice_id]
                else:
                    for v in preset_voices:
                        if v.id == guest_voice_id:
                            guest_profile = v
                            break
            
            # Generate and get actual sample rate
            audio_data = self.service.generate_audio(
                text=text,
                voice_id=voice_id,
                voice_profile=target_profile,
                guest_voice_profile=guest_profile,
                speed=speed,
                pitch=pitch,
                emotion="neutral"
            )
            if audio_data is None:
                return None
                
            return audio_data, self.service.model.sample_rate

        except Exception as e:
            logger.error(f"Speech generation error: {e}", exc_info=True)
            return None

    def add_voice_profile(
        self,
        name: str,
        audio_path: str,
        voice_type: VoiceType = VoiceType.UPLOADED,
    ) -> VoiceProfile:
        """Add a new voice profile to the in-memory cache."""
        voice_id = str(uuid.uuid4())
        profile = VoiceProfile(
            id=voice_id,
            name=name,
            type=voice_type,
            file_path=audio_path,
        )
        self.voices_cache[voice_id] = profile
        logger.info(f"Added voice profile: {name} (type: {voice_type})")
        return profile

    def delete_voice_profile(self, voice_id: str) -> bool:
        """Delete a voice profile and its associated file."""
        try:
            profile = self.voices_cache.get(voice_id)
            if not profile:
                return False

            # Delete the audio file
            if os.path.exists(profile.file_path):
                os.remove(profile.file_path)
                logger.info(f"Deleted voice file: {profile.file_path}")

            # Remove from cache
            del self.voices_cache[voice_id]
            logger.info(f"Deleted voice profile: {profile.name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete voice profile: {e}")
            raise

    async def enroll_voice(
        self,
        name: str,
        audio_path: str,
        voice_type: VoiceType = VoiceType.UPLOADED,
    ) -> VoiceProfile:
        """Enroll a new voice using Local Lyrebird cloning."""
        logger.info(f"Enrolling voice: {name} from {audio_path}")
        
        voice_id = self.service.enroll_voice(audio_url=audio_path) # Pass local path
        if not voice_id:
            raise Exception("Local voice enrollment failed.")

        # 3. Save to local cache/persistence
        profile = VoiceProfile(
            id=voice_id,
            name=name,
            type=voice_type,
            file_path=audio_path, # Keep local path for sample playback
        )
        self.voices_cache[voice_id] = profile
        logger.info(f"Successfully enrolled voice: {name} (ID: {voice_id})")
        return profile

    def get_voice_profiles(self) -> List[VoiceProfile]:
        """Return all available voice profiles (Presets + Local)."""
        presets = self.service.get_preset_voices()
        local_voices = list(self.voices_cache.values())
        return presets + local_voices

    def get_voice_profile(self, voice_id: str) -> Optional[VoiceProfile]:
        """Return a specific voice profile by id."""
        # Check local first
        if voice_id in self.voices_cache:
            return self.voices_cache[voice_id]
        
        # Check presets
        for v in self.service.get_preset_voices():
            if v.id == voice_id:
                return v
        return None

    def is_model_loaded(self) -> bool:
        """Return True if model is loaded (Always true for API service)."""
        return True
