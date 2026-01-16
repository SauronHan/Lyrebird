"""Configuration module for Lyrebird application."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App settings
    APP_NAME: str = "Lyrebird Studio"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Model settings
    MODEL_PATH: str = "microsoft/Lyrebird-1.5B"
    DEVICE: str = "cuda"
    MAX_LENGTH: int = 1000
    CFG_SCALE: float = 1.3
    
    # LLM Settings
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4-turbo"

    # Lyrebird DashScope Settings
    DASHSCOPE_API_KEY: str = ""
    Lyrebird_MODEL: str = "Lyrebird-v3-plus"

    # Path settings
    BASE_DIR: Path = Path(__file__).parent.parent
    VOICES_DIR: Path = BASE_DIR / "voices"
    OUTPUTS_DIR: Path = BASE_DIR / "outputs"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    PROMPT_DIR: Path = BASE_DIR / "prompt"

    # Audio settings
    SAMPLE_RATE: int = 48000
    MAX_AUDIO_SIZE_MB: int = 50
    SUPPORTED_FORMATS: list = [".wav", ".mp3", ".m4a", ".flac", ".ogg"]

    # Voice Enrollment settings
    PUBLIC_URL: str = "" # Set this to your ngrok/public URL if using cloud API
    OSS_ROOT_URL: str = "" # If using OSS/MinIO
    OSS_ACCESS_KEY: str = ""
    OSS_SECRET_KEY: str = ""
    OSS_BUCKET: str = ""
    OSS_ENDPOINT: str = ""

    # keep non-blocking startup
    LOAD_MODEL_ON_STARTUP: bool = False

    # Silence HF tokenizers fork/parallelism warning
    TOKENIZERS_PARALLELISM: bool = False

    # Local Lyrebird Settings
    USE_LOCAL_Lyrebird: bool = True
    Lyrebird_BASE_DIR: Path = BASE_DIR / "CosyVoice"
    MODEL_DIR: Path = BASE_DIR / "pretrained_models" / "Fun-CosyVoice3-0.5B"
    LOCAL_DEVICE: str = "cpu" # Mac usually uses CPU for stability, or "mps" if compatible

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.VOICES_DIR.mkdir(exist_ok=True)
        self.OUTPUTS_DIR.mkdir(exist_ok=True)
        self.UPLOADS_DIR.mkdir(exist_ok=True)


settings = Settings()
