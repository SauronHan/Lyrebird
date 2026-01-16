"""Data models for the application."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VoiceType(str, Enum):
    """Voice type enumeration."""

    RECORDED = "recorded"
    UPLOADED = "uploaded"
    PRESET = "preset"


class VoiceProfile(BaseModel):
    """Voice profile model."""

    id: str
    name: str
    type: VoiceType
    file_path: str
    created_at: datetime = Field(default_factory=datetime.now)
    description: Optional[str] = None

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class GenerationRequest(BaseModel):
    """TTS generation request model."""

    text: str
    voice_id: str
    num_speakers: int = Field(default=1, ge=1, le=4)
    cfg_scale: float = Field(default=1.3, ge=1.0, le=2.0)
    output_format: str = Field(default="wav")
    guest_voice_id: Optional[str] = None
    custom_filename: Optional[str] = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=1.0, ge=0.5, le=2.0)


class TaskStatus(str, Enum):
    """Task status enumeration."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationResponse(BaseModel):
    """TTS generation response model."""

    success: bool
    audio_url: Optional[str] = None
    filename: Optional[str] = None
    duration: Optional[float] = None
    message: str = ""
    generated_at: datetime = Field(default_factory=datetime.now)


class TaskResponse(BaseModel):
    """Async task response model."""

    task_id: str
    status: TaskStatus
    result: Optional[GenerationResponse] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class AudioRecording(BaseModel):
    """Audio recording model."""

    name: str
    audio_data: str  # Base64 encoded audio
    format: str = "wav"


class AudioFile(BaseModel):
    """Generated audio file model."""

    filename: str
    voice_name: str
    duration: float
    size: int  # File size in bytes
    text_preview: str  # First 100 chars of the text
    created_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}



class ScriptLine(BaseModel):
    id: Optional[str] = None
    speaker: str
    text: str


class ScriptOptimizationRequest(BaseModel):
    script: List[ScriptLine]


class AudioLibraryResponse(BaseModel):
    """Audio library response model."""

    success: bool
    audio_files: List[AudioFile]
    total: int
    message: Optional[str] = None
