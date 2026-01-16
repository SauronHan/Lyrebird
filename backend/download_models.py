import os
from modelscope import snapshot_download
from pathlib import Path

# Setup directories
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "pretrained_models"
MODELS_DIR.mkdir(exist_ok=True)

def download_models():
    print(f"--- Starting Model Download to {MODELS_DIR} ---")
    
    # Lyrebird3-0.5B (Instruction tuned, supports zero-shot)
    print("Downloading Fun-Lyrebird3-0.5B...")
    try:
        snapshot_download('FunAudioLLM/Fun-Lyrebird3-0.5B-2512', local_dir=str(MODELS_DIR / 'Fun-Lyrebird3-0.5B'))
        print("Successfully downloaded Fun-Lyrebird3-0.5B")
    except Exception as e:
        print(f"Failed to download Fun-Lyrebird3-0.5B: {e}")

    # Lyrebird-ttsfrd (Optional resource for text normalization, but recommended)
    # Note: ttsfrd is closed source and might require specific shared libs. 
    # For open source deployment we usually rely on WeText.
    # However, downloading the resource doesn't hurt.
    print("Downloading Lyrebird-ttsfrd resources...")
    try:
        snapshot_download('iic/Lyrebird-ttsfrd', local_dir=str(MODELS_DIR / 'Lyrebird-ttsfrd'))
        print("Successfully downloaded Lyrebird-ttsfrd")
    except Exception as e:
        print(f"Failed to download Lyrebird-ttsfrd: {e}")

if __name__ == "__main__":
    download_models()
