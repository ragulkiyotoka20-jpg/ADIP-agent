# CardioSim AI — Vision Possible: Agent Protocol 🏆

<div align="center">

![CardioSim AI](https://img.shields.io/badge/CardioSim-AI-red?style=for-the-badge&logo=heart&logoColor=white)
![Stream Vision Agents](https://img.shields.io/badge/Stream-Vision%20Agents%20SDK-blue?style=for-the-badge)
![Gemini Vision](https://img.shields.io/badge/Gemini-Vision%202.0-purple?style=for-the-badge&logo=google)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-green?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-teal?style=for-the-badge)

**Hackathon:** [Vision Possible: Agent Protocol](https://www.wemakedevs.org/hackathons/vision) by Stream × WeMakeDevs  
**Submission Deadline:** March 1, 2026

</div>

---

## 🎯 What We Built

**CardioSim AI** is a real-time cardiac emergency response platform that uses the **Stream Vision Agents SDK** to power two AI-driven camera experiences:

| Feature | What It Does |
|---|---|
| **🤖 Vision Agent CPR Coach** | Real-time CPR coaching — stream live video, MediaPipe detects sternum position, AI counts compressions automatically via wrist tracking |
| **🔬 Scan-Free Vitals** | Camera-based health screening for rural/village settings — measures breathing rate, analyzes skin color (pallor, cyanosis, jaundice), gives Gemini Vision AI health assessment |

> **Core insight:** 800+ million people in rural India have no access to ECGs, pulse oximeters, or X-rays. A smartphone camera + Vision AI can bridge this gap for community health workers.

---

## ⚡ Stream Vision Agents SDK — How We Used It

### Installation
```bash
npm install @stream-io/video-react-sdk
```

### Integration Points

#### 1. SDK Client Initialization (both tabs)
```jsx
import { StreamVideoClient } from "@stream-io/video-react-sdk";

const client = new StreamVideoClient({
  apiKey: import.meta.env.VITE_STREAM_API_KEY,
  user: { id: "cpr-coach-agent", name: "Vision CPR Agent" },
});
```

#### 2. Vision Agent CPR Coach (`VisionAgentCPR.jsx`)
```
Camera Stream (Stream SDK)
       ↓
MediaPipe Pose Detection
  → Sternum landmark → "COMPRESS HERE" AR crosshair
  → Wrist Y-position tracking → Auto compression count
       ↓
Backend: /api/vision-agent/analyze
  → Gemini 2.0 Flash → Real-time coaching text
       ↓
3-column UI: Protocol Steps | AR Camera | AI Coaching Panel
```

#### 3. Auto Compression Counting (Wrist Phase Machine)
```js
// Wrist drops below baseline → "down" phase
// Wrist rises back up → compression counted (+1)
if (compressionPhaseRef.current === "up" && wristY > baseline + PRESS_DOWN) {
    compressionPhaseRef.current = "down";
} else if (compressionPhaseRef.current === "down" && wristY < baseline + PRESS_UP) {
    setCompressions(c => c + 1);   // AUTO COUNT 🎯
    compressionPhaseRef.current = "up";
}
```

#### 4. Scan-Free Vitals (`QuickVitals.jsx`)
```
Camera Stream (Stream SDK)
       ↓
MediaPipe Pose → Shoulder Y oscillation → Breathing Rate (b/min)
       ↓
Frame Capture → Base64 JPEG
       ↓
Backend: /api/vision/vitals-scan
  → Gemini Vision 2.0 → Skin color, visible conditions, recommendations
       ↓
Results: Urgency level + Action steps + Doctor referral decision
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CardioSim AI Frontend                    │
│                      (React + Vite)                          │
│                                                              │
│  ┌───────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │Visualizer │  │ 🤖 Vision Agent │  │  🔬 Vitals Scan  │  │
│  │  (3D Heart│  │   CPR Coach     │  │  (Rural Health)  │  │
│  │  Three.js)│  │                 │  │                  │  │
│  │           │  │ ⚡ Stream SDK   │  │ ⚡ Stream SDK    │  │
│  │           │  │ 📷 MediaPipe    │  │ 📷 MediaPipe     │  │
│  │           │  │ 🤖 Auto Count   │  │ 🫁 Breathing     │  │
│  └───────────┘  └────────┬────────┘  └────────┬─────────┘  │
└───────────────────────────┼─────────────────────┼───────────┘
                            │ HTTP                │
┌───────────────────────────▼─────────────────────▼───────────┐
│                    FastAPI Backend (Python)                   │
│                                                              │
│  /api/vision-agent/analyze  ──→  Gemini 2.0 Flash           │
│  /api/vision/vitals-scan    ──→  Gemini Vision 2.0          │
│  /api/analyze               ──→  MedGemma 4B-IT             │
│  /api/explain               ──→  Gemini Flash                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 🤖 Vision Agent CPR Coach
- **Real-time body detection** — MediaPipe Pose finds shoulders, hips, and sternum
- **AR overlay** — Pulsing red "COMPRESS HERE" crosshair drawn on sternum in live video
- **Auto compression counting** — Wrist position tracked; each push down + up = +1 count (no manual button needed)
- **Gemini coaching** — Backend sends pose data to Gemini every 3s, returns real-time coaching ("Good depth", "Speed up", "Correct hand placement")
- **Metronome** — 110 BPM beat to maintain correct compression rate
- **5-step emergency protocol** — Call 999, Check Consciousness, Check Breathing, Chest Compressions, Rescue Breaths
- **Stream Vision Agents badge** — Visible on every frame; SDK initialized on component mount

### 🔬 Scan-Free Vitals (Rural Health)
- **Breathing rate measurement** — Shoulder Y-position oscillation counted over 30 seconds; no sensors required
- **Frame capture → Gemini Vision** — One click captures live camera frame as JPEG, sends to Gemini Vision API
- **Skin color analysis** — Detects pallor (anemia/shock), cyanosis (cardiac/respiratory), jaundice (liver)
- **Visible symptom detection** — Sunken eyes (dehydration), facial drooping (stroke), labored breathing
- **FAST stroke check** — Face drooping, Arm weakness, Speech difficulty
- **ORS recipe** — Inline dehydration treatment for field use
- **Doctor referral decision** — AI outputs `refer_doctors: true/false` with urgency level
- **Works offline** — Breathing rate measured locally; AI scan requires internet for Gemini

### 🫀 3D Heart Visualizer (Existing)
- Three.js anatomical heart with blood flow particles
- Intervention simulator (stent, bypass, angioplasty)
- MedGemma 4B-IT integration for cardiac analysis
- Scenario loading (Myocardial Infarction, Arrhythmia, etc.)

---

## 📁 Project Structure

```
ai3d/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── VisionAgentCPR.jsx    ⚡ Stream SDK + CPR coaching
│       │   ├── QuickVitals.jsx       🔬 Scan-free rural health tool
│       │   ├── HeartViewer.jsx       🫀 3D heart (Three.js)
│       │   ├── InterventionSim.jsx   💉 Intervention simulator
│       │   └── CPRGuide.jsx          🚨 Emergency CPR text guide
│       ├── styles/
│       │   ├── vision-agent.css      Styles for Vision Agent tab
│       │   ├── quick-vitals.css      Styles for Vitals tab
│       │   └── index.css             Global styles
│       └── App.jsx                   Main app + navigation
│
├── backend/
│   ├── main.py                       FastAPI app + CORS
│   └── routes/
│       ├── vision_agent.py           /api/vision-agent/analyze (Gemini coaching)
│       ├── vision_scan.py            /api/vision/vitals-scan (Gemini Vision)
│       ├── analyze.py                /api/analyze (MedGemma)
│       └── explain.py                /api/explain (Gemini Flash)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google AI API key (for Gemini)
- Stream API key (for full SDK feature — optional for local demo)

### 1. Clone the repo
```bash
git clone https://github.com/Ariya-rithvik/VisionAgent.git
cd VisionAgent
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set your API key
set GOOGLE_GENAI_API_KEY=your_key_here

# Start server
python -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Optional: add your Stream API key
# Create .env file:
echo VITE_STREAM_API_KEY=your_stream_key > .env

npm run dev
```

Open **http://localhost:5173**

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_GENAI_API_KEY` | ✅ Yes | Gemini API key for coaching + vision scan |
| `VITE_STREAM_API_KEY` | Optional | Stream Video API key (demo key built-in) |
| `MEDGEMMA_MOCK` | Optional | `true` for mock mode (no GPU needed) |

---

## 🎬 Demo Flow

### Vision Agent CPR Coach
1. Click **🤖 Vision AI** tab
2. Click **Step 4 – Chest Compressions**
3. Click **⚡ Start Vision Agent** → allow camera
4. Point camera at your chest — see the **"COMPRESS HERE"** AR crosshair appear on sternum
5. Push your hands down and up rhythmically — the **compression counter increments automatically**
6. Real-time coaching appears in the right panel from Gemini AI
7. Complete 30 compressions → "💨 Give 2 rescue breaths now!" prompt appears

### Scan-Free Vitals
1. Click **🔬 Vitals** tab
2. Click **⚡ Start Vitals Scan** → allow camera
3. Point at a person's face + upper chest
4. Wait 30 seconds — breathing rate calculated automatically from shoulder movement
5. Add patient notes (age, symptoms, duration)
6. Click **📸 Run AI Scan**
7. Gemini Vision AI analyzes: skin color, breathing effort, visible conditions
8. Get urgency report + recommendations + doctor referral decision

---

## 📊 Hackathon Requirements Checklist

| Requirement | Status | Implementation |
|---|---|---|
| Use Stream Vision Agents SDK | ✅ | `@stream-io/video-react-sdk` installed, `StreamVideoClient` initialized in both `VisionAgentCPR.jsx` and `QuickVitals.jsx` |
| Real-time video AI understanding | ✅ | MediaPipe Pose processes every camera frame at ~30fps |
| Vision + LLM combination | ✅ | MediaPipe (vision) + Gemini 2.0 Flash / Gemini Vision (LLM) |
| Ultra-low latency | ✅ | MediaPipe runs locally in browser; Gemini called async every 3s |
| Novel real-world use case | ✅ | CPR coaching + rural health screening — potentially life-saving |
| Stream badge visible | ✅ | "⚡ Stream Vision Agents" badge on every camera frame + header |
| Public GitHub repo | ✅ | This repo |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Video / Vision SDK** | Stream Video React SDK (`@stream-io/video-react-sdk`) |
| **Pose Detection** | MediaPipe Pose (Google) — runs in browser |
| **AI / LLM** | Gemini 2.0 Flash, Gemini Vision 2.0, MedGemma 4B-IT |
| **Frontend** | React 18 + Vite |
| **3D Visualization** | Three.js |
| **Backend** | FastAPI (Python) |
| **Styling** | Vanilla CSS (dark theme, glassmorphism) |

---

## 🌏 Impact

This project directly addresses healthcare inequality:

- **Rural India:** 800M+ people without access to diagnostic equipment
- **CPR survival:** Only 10% of cardiac arrest victims outside hospitals survive — real-time AI coaching improves outcomes
- **ASHA/ANM workers:** Community health workers can now screen patients using only a smartphone
- **Cost:** ECG = ₹500–2,000 | This tool = ₹0 (one-time smartphone)
- **Time:** Nearest X-ray = 1–3 hour drive | This tool = 30 seconds

---

## 👤 Team

**Ariya Rithvik**  
Building AI tools for cardiac emergency response and rural healthcare access.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🔗 Links

- 🏆 [Hackathon Page](https://www.wemakedevs.org/hackathons/vision)
- ⭐ [Star Stream Vision Agents](https://github.com/GetStream/Vision-Agents) (required for swag!)
- 📝 [Submit Your Entry](https://forms.gle/oG7hWZ1tgbSwbcie8)
- 📦 [Stream Video React SDK](https://www.npmjs.com/package/@stream-io/video-react-sdk)

---

<div align="center">
  
**Built with ⚡ Stream Vision Agents SDK × Gemini Vision × MediaPipe**

*"Every second counts in a cardiac emergency. AI makes every second better."*

</div>
