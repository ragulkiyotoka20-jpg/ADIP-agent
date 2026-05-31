"""
Vision Agent Route — Real-time CPR coaching via Stream Vision Agents SDK.
Accepts pose landmark data from the frontend and returns Gemini-powered coaching.
Part of the Vision Possible hackathon submission (WeMakeDevs × Stream).
"""
import os
import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Request / Response Schemas ───────────────────────────────────────────────

class PoseLandmark(BaseModel):
    x: float
    y: float
    z: float = 0.0
    visibility: float = 1.0


class VisionAnalysisRequest(BaseModel):
    step: int                                     # CPR step index (0-4)
    compressions: int                             # Total compressions so far
    landmark_detected: bool                       # Whether sternum point was found
    sternum_x: Optional[float] = None            # Sternum x fraction (0–1)
    sternum_y: Optional[float] = None            # Sternum y fraction (0–1)
    shoulder_width_px: Optional[float] = None    # Estimated shoulder width in px
    session_id: Optional[str] = None


class VisionAnalysisResponse(BaseModel):
    coaching: str
    urgency_level: str           # "ok" | "warning" | "critical"
    technique_score: int         # 0–100
    next_action: str
    ai_provider: str


# ─── Rule-based fallback coaching ─────────────────────────────────────────────

STEP_COACHING = {
    0: {
        "coaching": "Step 1: Call emergency services NOW. Put your phone on speaker so both hands stay free. Do NOT leave the patient alone.",
        "next_action": "Dial 112 / 911 / 999 immediately",
        "urgency_level": "critical",
        "technique_score": 100,
    },
    1: {
        "coaching": "Step 2: Tap the patient's shoulders firmly and shout 'Are you okay?' If no response, they need help immediately.",
        "next_action": "Check for response",
        "urgency_level": "warning",
        "technique_score": 100,
    },
    2: {
        "coaching": "Step 3: Tilt the head back, lift the chin. Look, listen and feel for breathing for 10 seconds.",
        "next_action": "Start 10-second breathing check",
        "urgency_level": "warning",
        "technique_score": 100,
    },
    3: {
        "coaching": "Step 4: Compressions active. Push HARD at least 5–6 cm deep. Rate: 100–120 per minute. Lock your elbows, use body weight.",
        "next_action": "Continue 30 compressions, then 2 rescue breaths",
        "urgency_level": "ok",
        "technique_score": 85,
    },
    4: {
        "coaching": "Step 5: After 30 compressions — tilt head, lift chin, pinch nose, give 2 breaths (1 second each). If untrained, skip breaths and continue compressions only.",
        "next_action": "2 rescue breaths, then resume compressions",
        "urgency_level": "ok",
        "technique_score": 90,
    },
}


def build_coaching_prompt(req: VisionAnalysisRequest) -> str:
    step_names = [
        "Call Emergency Services",
        "Check Consciousness",
        "Check Breathing",
        "Chest Compressions",
        "Rescue Breaths",
    ]
    step_name = step_names[req.step] if 0 <= req.step < 5 else "Unknown"

    landmark_info = (
        f"Sternum detected at ({req.sternum_x:.2f}, {req.sternum_y:.2f}) of frame"
        if req.landmark_detected and req.sternum_x is not None
        else "No body detected in camera frame yet"
    )

    return f"""You are a real-time CPR coaching AI integrated into a Vision Agent system.
A bystander is performing emergency CPR and needs immediate, clear guidance.

Current CPR step: {step_name} (Step {req.step + 1} of 5)
Compressions delivered so far: {req.compressions}
Vision Agent body detection: {landmark_info}

Provide coaching in 2–3 short sentences. Be direct and action-oriented.
If compressions > 0 and step is 3: comment on rhythm, encourage continuation.
If no body detected and step is 3: urge repositioning camera.
If compressions hit multiples of 30 (currently {req.compressions}): remind about rescue breaths.

Return ONLY the coaching text, no JSON, no markdown. Plain sentences."""


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/vision-agent/analyze", response_model=VisionAnalysisResponse)
async def analyze_cpr_vision(req: VisionAnalysisRequest):
    """
    Real-time CPR coaching endpoint for Vision Agent mode.
    Called every ~2 seconds with pose data from the frontend camera stream.
    Uses Gemini for intelligent coaching, falls back to protocol-based guidance.
    """
    # Always start with the rule-based fallback
    fallback = STEP_COACHING.get(req.step, STEP_COACHING[0])
    coaching = fallback["coaching"]
    urgency_level = fallback["urgency_level"]
    technique_score = fallback["technique_score"]
    next_action = fallback["next_action"]
    ai_provider = "Protocol Engine (Vision Agent)"

    # Override technique score based on compression state
    if req.step == 3:
        if not req.landmark_detected:
            technique_score = 40
            urgency_level = "warning"
            next_action = "Reposition camera to see patient's chest"
        elif req.compressions > 0 and req.compressions % 30 == 0:
            urgency_level = "warning"
            next_action = "STOP — Give 2 rescue breaths NOW, then resume"

    # Try Gemini for richer coaching
    api_key = os.getenv("GOOGLE_GENAI_API_KEY", "")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = build_coaching_prompt(req)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=150,
                    temperature=0.3,
                )
            )
            if response.text:
                coaching = response.text.strip()
                ai_provider = "Gemini 2.0 Flash (Vision Agent)"
        except Exception as e:
            logger.warning(f"[VisionAgent] Gemini error: {e}. Using fallback.")

    return VisionAnalysisResponse(
        coaching=coaching,
        urgency_level=urgency_level,
        technique_score=technique_score,
        next_action=next_action,
        ai_provider=ai_provider,
    )


@router.get("/vision-agent/health")
async def vision_agent_health():
    """Check Vision Agent service status."""
    return {
        "status": "ok",
        "service": "Vision Agent CPR Coach",
        "sdk": "Stream Vision Agents",
        "gemini_enabled": bool(os.getenv("GOOGLE_GENAI_API_KEY")),
        "version": "1.0.0",
    }
