"""Main FastAPI application."""

import os
# Force MPS fallback for unimplemented operators before any torch imports
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import router

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Filter out frequent task polling from access logs
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Filter out /api/tasks/ endpoint from logs
        return record.args and len(record.args) >= 3 and "/api/tasks/" not in str(record.args[2])

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Beautiful AI Voice Synthesis Application",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Mount static files for uploads (useful for cloud APIs fetching audio)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Root endpoint - status check
@app.get("/")
async def root():
    return {"message": "Lyrebird Backend API is running. Please use the frontend at /web to access the application."}


# Run the application
if __name__ == "__main__":
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Server running on http://{settings.HOST}:{settings.PORT}")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
