"""
Vision Scan — Scan-Free Health Assessment
Accepts a base64 image frame from the camera and sends it to Gemini Vision
to provide preliminary health indicators for rural / low-resource settings.
"""

import base64
import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
import re

router = APIRouter()

# ── Gemini setup ──────────────────────────────────────────────────────────────
try:
    from google import genai
    from google.genai import types
    _client = genai.Client(api_key=os.getenv("GOOGLE_GENAI_API_KEY", ""))
    _GEMINI_OK = True
except Exception:
    _GEMINI_OK = False


# ── Request / Response ─────────────────────────────────────────────────────────
class VitalsScanRequest(BaseModel):
    image_b64: str          # base64-encoded JPEG/PNG frame
    breathing_rate: Optional[float] = None   # breaths/min from frontend
    compressions: Optional[int] = None
    patient_notes: Optional[str] = ""       # any notes from the user


class VitalsScanResponse(BaseModel):
    urgency: str            # ok / warning / critical
    urgency_label: str
    skin_color: str         # observed skin tone note
    visible_conditions: list[str]
    breathing_assessment: str
    heart_assessment: str
    recommendations: list[str]
    refer_doctors: bool
    ai_provider: str
    raw_summary: str


# ── Fallback (no Gemini) ──────────────────────────────────────────────────────
def _fallback(req: VitalsScanRequest) -> VitalsScanResponse:
    br = req.breathing_rate or 0
    urgency = "ok"
    urgency_label = "Appears Stable"
    flags = []

    if br > 25:
        urgency = "warning"
        urgency_label = "Elevated Breathing Rate"
        flags.append("High breathing rate detected — possible respiratory distress")
    elif br < 8 and br > 0:
        urgency = "warning"
        urgency_label = "Low Breathing Rate"
        flags.append("Breathing rate below normal — monitor closely")
    elif br == 0:
        flags.append("Breathing rate not measured — start camera and wait 30 seconds")

    return VitalsScanResponse(
        urgency=urgency,
        urgency_label=urgency_label,
        skin_color="Unable to assess — Gemini Vision not available",
        visible_conditions=flags or ["No obvious distress detected from motion data"],
        breathing_assessment=f"{br:.1f} breaths/min" if br else "Not measured",
        heart_assessment="Heart rate estimation requires Gemini Vision",
        recommendations=[
            "Keep patient calm and lying flat",
            "Check for labored breathing or unusual skin color",
            "If available, go to nearest health center"
        ],
        refer_doctors=br > 25 or (br < 8 and br > 0),
        ai_provider="Rule-based fallback",
        raw_summary="Gemini Vision unavailable — showing motion-based assessment only"
    )


# ── Gemini Vision analysis ────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an AI health assistant helping community health workers in rural areas
who have no access to ECG, pulse oximeters, or X-rays.
Analyze the camera image of a patient's face/chest and return a JSON object with these fields:
{
  "urgency": "ok" | "warning" | "critical",
  "urgency_label": "short description",
  "skin_color": "brief observation on skin tone (pallor, cyanosis, jaundice, normal)",
  "visible_conditions": ["list of visible signs or symptoms"],
  "breathing_assessment": "brief assessment based on visible breathing",
  "heart_assessment": "any visible cardiovascular signs (lip color, nail beds if visible, face color)",
  "recommendations": ["actionable steps the community worker can take now"],
  "refer_doctors": true | false
}

Focus on:
- Skin color: pale (shock/anemia), bluish/cyanotic (cardiac/respiratory), yellow (jaundice/liver)
- Visible breathing effort (labored, fast, irregular)
- Face: sunken eyes (dehydration), unusual facial drooping (stroke), confusion/disorientation
- Lips and visible extremities for color
- Signs of distress (sweating, grimacing)

Be practical and helpful for a non-medical community health worker.
Return ONLY valid JSON, no markdown, no explanation."""


def _parse_gemini_json(text: str) -> dict:
    """Extract JSON from Gemini response."""
    # Strip markdown code fences if present
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    return json.loads(text)


async def _gemini_scan(req: VitalsScanRequest) -> VitalsScanResponse:
    """Send image to Gemini Vision for health assessment."""
    br_note = f"Breathing rate (from camera motion): {req.breathing_rate:.1f} breaths/min" \
              if req.breathing_rate else "Breathing rate not available."
    note = req.patient_notes or "No additional notes."

    user_text = (
        f"Please analyze this patient image.\n"
        f"{br_note}\n"
        f"Health worker notes: {note}\n"
        f"Provide a preliminary health assessment for a rural community health worker."
    )

    # Decode base64 image
    img_bytes = base64.b64decode(req.image_b64)

    response = _client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text=user_text),
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            max_output_tokens=800,
        ),
    )

    data = _parse_gemini_json(response.text)

    return VitalsScanResponse(
        urgency=data.get("urgency", "ok"),
        urgency_label=data.get("urgency_label", "Assessment complete"),
        skin_color=data.get("skin_color", ""),
        visible_conditions=data.get("visible_conditions", []),
        breathing_assessment=data.get("breathing_assessment", ""),
        heart_assessment=data.get("heart_assessment", ""),
        recommendations=data.get("recommendations", []),
        refer_doctors=data.get("refer_doctors", False),
        ai_provider="Gemini Vision 2.0 Flash",
        raw_summary=response.text[:300],
    )


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/vision/vitals-scan", response_model=VitalsScanResponse)
async def vitals_scan(req: VitalsScanRequest):
    """
    Analyze a camera frame and breathing rate to give health assessment
    for patients in low-resource / rural settings.
    """
    if not _GEMINI_OK:
        return _fallback(req)
    try:
        return await _gemini_scan(req)
    except Exception as e:
        result = _fallback(req)
        result.ai_provider = f"Fallback (Gemini error: {str(e)[:60]})"
        return result


# ── Standalone breathing-rate endpoint (no image needed) ──────────────────────
class BreathingRequest(BaseModel):
    breathing_rate: float
    patient_notes: Optional[str] = ""


@router.post("/vision/breathing-assess")
async def assess_breathing(req: BreathingRequest):
    """Quick text-only breathing rate assessment."""
    br = req.breathing_rate
    if br < 8:
        return {"status": "critical", "label": "Bradypnea", "note": f"{br:.1f} bpm — dangerously slow. Prepare rescue breaths."}
    elif br <= 12:
        return {"status": "warning", "label": "Slow Breathing", "note": f"{br:.1f} bpm — below normal (12–20 bpm). Monitor closely."}
    elif br <= 20:
        return {"status": "ok", "label": "Normal", "note": f"{br:.1f} bpm — normal range (12–20 bpm)."}
    elif br <= 25:
        return {"status": "warning", "label": "Mildly Elevated", "note": f"{br:.1f} bpm — slightly high. Check for anxiety or mild infection."}
    else:
        return {"status": "critical", "label": "Tachypnea", "note": f"{br:.1f} bpm — fast breathing. Possible respiratory distress, pneumonia, or heart failure."}
