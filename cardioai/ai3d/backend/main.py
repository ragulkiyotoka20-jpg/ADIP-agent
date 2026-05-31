"""
CardioSim AI — FastAPI Backend
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.explain import router as explain_router
from routes.mentor import router as mentor_router
from routes.emergency import router as emergency_router
from routes.video_generation import router as video_router
from routes.vision_agent import router as vision_agent_router
from routes.vision_scan import router as vision_scan_router

app = FastAPI(title="CardioSim AI API", version="2.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(explain_router, prefix="/api")
app.include_router(mentor_router, prefix="/api")
app.include_router(emergency_router, prefix="/api")
app.include_router(video_router, prefix="/api")
app.include_router(vision_agent_router, prefix="/api")
app.include_router(vision_scan_router, prefix="/api")

@app.get("/health")
def health():
    mock_mode = os.getenv("MEDGEMMA_MOCK", "true").lower() == "true"
    return {
        "status": "ok",
        "service": "CardioSim AI",
        "version": "2.2.0",
        "mock_mode": mock_mode,
        "model_id": None if mock_mode else os.getenv("MEDGEMMA_MODEL_ID", "google/medgemma-4b-it"),
        "gemini_enabled": bool(os.getenv("GEMINI_API_KEY")),
        "genie_enabled": bool(os.getenv("GOOGLE_GENAI_API_KEY")),
        "video_generation_enabled": bool(os.getenv("VIDEO_GENERATION_ENABLED")),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["routes"],
    )
