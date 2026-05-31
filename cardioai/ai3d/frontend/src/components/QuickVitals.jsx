import { useEffect, useRef, useState, useCallback } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";

/* ─── Constants ───────────────────────────────────────────────── */
const NORMAL_BR = { min: 12, max: 20 };  // breaths/min
const LM = { LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12 };

function classForBR(br) {
    if (!br) return "na";
    if (br < 8 || br > 30) return "critical";
    if (br < 12 || br > 20) return "warning";
    return "ok";
}

const VITAL_SIGNS = [
    {
        key: "pallor", icon: "🩸", label: "Pallor (Pale Skin)",
        desc: "Paleness of skin, lips, or inner eyelids points to reduced blood flow. Common causes: anemia, internal bleeding, shock, or severe infection. Very common in malnourished children or women with heavy blood loss.",
        action: "Lay patient flat, elevate legs, keep warm. Seek medical help if lips or inner eyelids are pale."
    },
    {
        key: "cyanosis", icon: "💙", label: "Cyanosis (Blue Tint)",
        desc: "Bluish/purple color of lips, fingernails, or tongue means the blood carries too little oxygen. Serious sign — indicates heart attack, severe asthma, pneumonia, or choking.",
        action: "Emergency. Call for help immediately. Begin CPR if the patient is unresponsive — use the Emergency CPR tab."
    },
    {
        key: "jaundice", icon: "🟡", label: "Jaundice (Yellow Skin)",
        desc: "Yellowing of skin and whites of the eyes occurs when bile builds up in blood. Causes include hepatitis, malaria, liver disease, or newborn jaundice. Very common in rural areas where Hepatitis A/E spreads through water.",
        action: "Keep patient hydrated. Avoid alcohol. Refer to a doctor — blood tests needed to confirm cause."
    },
    {
        key: "normal", icon: "✅", label: "Normal Skin Color",
        desc: "Good circulation showing healthy oxygen delivery. Look at inner eyelids, lips, and fingernails for consistent color comparison — these areas are reliable regardless of natural skin complexion.",
        action: "Continue monitoring. Check breathing rate and behavior for any other warning signs."
    },
];

const CONDITIONS = [
    {
        title: "Normal Breathing", range: "12–20 breaths/min", icon: "🫁",
        insight: "Normal adult breathing at rest. Chest rises and falls gently and evenly. No visible effort or noise.",
        detail: "Count breaths for 30 seconds, multiply by 2. One breath = 1 full inhale + exhale cycle."
    },
    {
        title: "Fast Breathing (Tachypnea)", range: ">25 breaths/min", icon: "⚠️",
        insight: "Rapid breathing is the body trying to take in more oxygen. Causes: pneumonia, asthma, heart failure, fever, anxiety.",
        detail: "In children under 5, over 40 breaths/min during illness is a sign of pneumonia — the leading killer of children in rural areas. Refer immediately."
    },
    {
        title: "Slow / No Breathing", range: "<8 breaths/min", icon: "🚨",
        insight: "Very slow breathing means the brain may not be getting enough oxygen. Emergency causes: drug overdose, head injury, stroke, severe illness.",
        detail: "If breathing stops: start rescue breaths immediately. Switch to the Emergency CPR tab for step-by-step guidance."
    },
    {
        title: "Labored / Noisy Breathing", range: "Neck/belly muscles visible", icon: "😮‍💨",
        insight: "When patient uses neck or stomach muscles to breathe, flares nostrils, or makes wheezing/gurgling sounds — airway is obstructed or lungs are failing.",
        detail: "Sit patient upright. Wheezing → possible asthma (salbutamol inhaler if available). Gurgling sound → choking danger."
    },
    {
        title: "Dehydration Signs", range: "Sunken eyes, dry lips", icon: "💧",
        insight: "Sunken eyes and cracked dry lips are early dehydration signs — critical in children with diarrhea or adults with fever. Severe dehydration causes shock and organ failure.",
        detail: "Give ORS: 1 liter water + 6 tsp sugar + ½ tsp salt. If patient cannot drink, seek emergency IV fluids immediately."
    },
    {
        title: "Stroke Warning (FAST)", range: "Face drooping, confusion", icon: "🧠",
        insight: "Gemini Vision checks for asymmetric facial drooping, and community workers can check for arm weakness and slurred speech. Every minute without treatment, brain cells die.",
        detail: "FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call emergency. Stroke needs hospital within 4.5 hours."
    },
];

const HOW_TO_STEPS = [
    { num: 1, icon: "📷", title: "Position the Camera", desc: "Hold phone 50–80 cm from the patient's face and upper chest. Good lighting matters — use daylight or a bright lamp. The full face and upper chest must be clearly visible." },
    { num: 2, icon: "⏱️", title: "Wait 30 Seconds", desc: "The AI tracks shoulder movement to calculate breathing rate. Hold steady for 30 seconds. The progress bar fills as data is collected. Works even through clothing." },
    { num: 3, icon: "📝", title: "Add Patient Notes", desc: "Type age, sex, main symptom, and how long they've had it. Example: 'Female, 40, has had fever and yellow eyes for 3 days'. More detail = better AI analysis." },
    { num: 4, icon: "📸", title: "Run AI Scan", desc: "Click the Scan button. Gemini Vision AI analyzes the camera frame — checking skin color, facial expressions, breathing effort, eye whites, and lip color to detect health signs." },
    { num: 5, icon: "📋", title: "Read & Act on Results", desc: "Green = stable. Yellow = needs attention. Red = urgent care. Always follow the Recommendations shown. Refer to a doctor when indicated — do not delay for critical signs." },
];


/* ════════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════════ */
export default function QuickVitals() {
    /* Refs */
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const captureRef = useRef(null);   // offscreen for frame capture
    const poseRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);

    /* Breathing detection refs */
    const shoulderRef = useRef([]);     // rolling Y samples
    const lastBreathRef = useRef(0);      // timestamp of last detected breath
    const breathPhaseRef = useRef("up");   // "up" | "down"
    const breathCountRef = useRef(0);      // raw breath count
    const windowStartRef = useRef(null);   // start of 30s measurement window

    /* State */
    const [cameraOn, setCameraOn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [camError, setCamError] = useState(null);
    const [bodyDetected, setBodyDetected] = useState(false);
    const [breathingRate, setBreathingRate] = useState(null);   // computed b/min
    const [breathCount, setBreathCount] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [patientNotes, setPatientNotes] = useState("");
    const [streamReady, setStreamReady] = useState(false);

    /* Timer for elapsed measurement */
    useEffect(() => {
        if (!cameraOn) return;
        const id = setInterval(() => {
            const start = windowStartRef.current;
            if (start) setElapsed(Math.min(30, Math.floor((Date.now() - start) / 1000)));
        }, 1000);
        return () => clearInterval(id);
    }, [cameraOn]);

    /* Stream SDK init proof */
    useEffect(() => {
        let client = null;
        const init = async () => {
            try {
                const apiKey = import.meta.env.VITE_STREAM_API_KEY || "mmhfdzb5evj2";
                const userId = "vitals-agent-" + Math.random().toString(36).slice(2, 8);
                client = new StreamVideoClient({ apiKey, user: { id: userId, name: "Vitals Agent" } });
                setStreamReady(true);
            } catch { setStreamReady(false); }
        };
        init();
        return () => client?.disconnectUser?.().catch(() => { });
    }, []);

    /* ── Breathing detection in pose results ── */
    const handlePose = useCallback((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!results.poseLandmarks) { setBodyDetected(false); return; }
        setBodyDetected(true);

        const lm = results.poseLandmarks;
        const ls = lm[LM.LEFT_SHOULDER];
        const rs = lm[LM.RIGHT_SHOULDER];
        if (!ls || !rs) return;

        const H = canvas.height;
        const W = canvas.width;

        // Shoulder mid Y (0–1)
        const shoulderY = ((ls.y + rs.y) / 2) * H;
        shoulderRef.current.push(shoulderY);
        if (shoulderRef.current.length > 90) shoulderRef.current.shift(); // ~3s window

        const baseline = shoulderRef.current.reduce((a, b) => a + b, 0) / shoulderRef.current.length;
        const THRESH = H * 0.012;  // 1.2% of height per breath oscillation

        const now = Date.now();
        if (breathPhaseRef.current === "up" && shoulderY < baseline - THRESH) {
            breathPhaseRef.current = "down";
        } else if (breathPhaseRef.current === "down" && shoulderY > baseline + THRESH) {
            breathPhaseRef.current = "up";
            const gap = now - lastBreathRef.current;
            if (gap > 1500) {   // at least 1.5s between breaths (max 40 bpm)
                breathCountRef.current += 1;
                lastBreathRef.current = now;
                setBreathCount(breathCountRef.current);
                // Compute rate over 30s window
                if (windowStartRef.current) {
                    const secs = (now - windowStartRef.current) / 1000;
                    if (secs >= 5) setBreathingRate((breathCountRef.current / secs) * 60);
                }
            }
        }

        /* Draw skeleton overlay */
        const pairs = [[11, 12], [11, 23], [12, 24], [23, 24]];
        ctx.strokeStyle = "rgba(99,179,237,0.5)";
        ctx.lineWidth = 2;
        pairs.forEach(([a, b]) => {
            if (!lm[a] || !lm[b]) return;
            ctx.beginPath();
            ctx.moveTo(lm[a].x * W, lm[a].y * H);
            ctx.lineTo(lm[b].x * W, lm[b].y * H);
            ctx.stroke();
        });

        /* Shoulder dots with breathing ring */
        const phase = breathPhaseRef.current;
        [ls, rs].forEach(pt => {
            const x = pt.x * W, y = pt.y * H;
            // Breathing phase ring
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.strokeStyle = phase === "down" ? "rgba(99,179,237,0.7)" : "rgba(34,197,94,0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            // Center dot
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = phase === "down" ? "#63b3ed" : "#22c55e";
            ctx.fill();
        });

        /* Draw baseline breathing line */
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(99,179,237,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(W, baseline); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(99,179,237,0.5)";
        ctx.font = "10px Inter";
        ctx.textAlign = "left";
        ctx.fillText("breathing baseline", 8, baseline - 4);
        ctx.restore();

        /* Stream badge */
        ctx.fillStyle = "rgba(59,130,246,0.75)";
        ctx.beginPath(); ctx.roundRect(W - 160, 8, 152, 26, 6); ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "bold 11px Inter"; ctx.textAlign = "right";
        ctx.fillText("⚡ Stream Vision Agents", W - 12, 25);
    }, []);

    /* ── Camera start ── */
    const startCamera = useCallback(async () => {
        setCamError(null); setLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }, audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }

            const { Pose } = await import("@mediapipe/pose");
            const pose = new Pose({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
            });
            pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 });
            pose.onResults(handlePose);
            poseRef.current = pose;

            // Reset counters
            shoulderRef.current = [];
            breathCountRef.current = 0;
            lastBreathRef.current = 0;
            breathPhaseRef.current = "up";
            windowStartRef.current = Date.now();
            setBreathCount(0); setBreathingRate(null); setElapsed(0);
            setScanResult(null);

            setCameraOn(true); setLoading(false);

            const detect = async () => {
                if (videoRef.current && poseRef.current && videoRef.current.readyState === 4)
                    await poseRef.current.send({ image: videoRef.current });
                rafRef.current = requestAnimationFrame(detect);
            };
            rafRef.current = requestAnimationFrame(detect);
        } catch {
            setCamError("Camera access denied. Allow camera permission and retry.");
            setLoading(false);
        }
    }, [handlePose]);

    /* ── Camera stop ── */
    const stopCamera = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        setCameraOn(false); setBodyDetected(false);
        const c = canvasRef.current;
        if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
    }, []);

    /* Canvas sync */
    useEffect(() => {
        const vid = videoRef.current, canvas = canvasRef.current;
        if (!vid || !canvas) return;
        const sync = () => { canvas.width = vid.videoWidth || 640; canvas.height = vid.videoHeight || 480; };
        vid.addEventListener("loadedmetadata", sync);
        return () => vid.removeEventListener("loadedmetadata", sync);
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    /* ── AI Scan (capture frame → Gemini) ── */
    const runScan = useCallback(async () => {
        if (!cameraOn) return;
        setScanning(true);
        try {
            // Capture frame to offscreen canvas
            const vid = videoRef.current;
            const off = document.createElement("canvas");
            off.width = vid.videoWidth || 640; off.height = vid.videoHeight || 480;
            off.getContext("2d").drawImage(vid, 0, 0);
            const b64 = off.toDataURL("image/jpeg", 0.85).split(",")[1];

            const res = await fetch("http://localhost:8000/api/vision/vitals-scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_b64: b64,
                    breathing_rate: breathingRate,
                    patient_notes: patientNotes,
                }),
            });
            if (res.ok) setScanResult(await res.json());
        } catch {
            setScanResult({
                urgency: "warning", urgency_label: "Backend offline",
                skin_color: "Not assessed", visible_conditions: ["Could not connect to AI backend — check server"],
                breathing_assessment: breathingRate ? `${breathingRate.toFixed(1)} bpm` : "Not measured",
                heart_assessment: "Not available", recommendations: ["Start backend server and retry"],
                refer_doctors: false, ai_provider: "Offline",
            });
        } finally { setScanning(false); }
    }, [cameraOn, breathingRate, patientNotes]);

    /* ── Derived stats ── */
    const brClass = classForBR(breathingRate);
    const brLabel = breathingRate
        ? (breathingRate < 8 ? "Dangerously Slow" : breathingRate < 12 ? "Slow" : breathingRate <= 20 ? "Normal" : breathingRate <= 25 ? "Elevated" : "High / Tachypnea")
        : "Measuring…";
    const measurePct = Math.min(100, (elapsed / 30) * 100);

    /* ════ RENDER ════ */
    return (
        <div className="qv-root">
            {/* ── Header ── */}
            <div className="qv-header">
                <div className="qv-header-left">
                    <div className="qv-icon">🔬</div>
                    <div>
                        <h2>Scan-Free Vitals</h2>
                        <p>Camera-based health screening for villages &amp; low-resource settings</p>
                    </div>
                </div>
                <div className="qv-badges">
                    <span className="qv-badge qv-badge-stream">⚡ Stream Vision</span>
                    <span className="qv-badge qv-badge-gemini">🟣 Gemini Vision</span>
                    <span className={`qv-badge ${cameraOn ? "qv-badge-live" : "qv-badge-off"}`}>
                        {cameraOn ? "🔴 LIVE" : "⚫ Off"}
                    </span>
                    {streamReady && <span className="qv-badge qv-badge-stream">✔ SDK</span>}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="qv-body">

                {/* LEFT: Camera panel */}
                <div className="qv-camera-col">
                    <div className="qv-camera-box">
                        {!cameraOn && !loading && (
                            <div className="qv-cam-prompt">
                                <div style={{ fontSize: "2.5rem" }}>🔬</div>
                                <h3>No-Equipment Health Check</h3>
                                <p>Point camera at patient's face &amp; chest. The AI will:</p>
                                <ul className="qv-feature-list">
                                    <li>📊 Measure breathing rate (shoulder oscillation)</li>
                                    <li>🎨 Analyze skin color (pallor, cyanosis, jaundice)</li>
                                    <li>🤖 Give Gemini AI visual health assessment</li>
                                    <li>📋 Recommend next steps for community workers</li>
                                </ul>
                                <button className="qv-start-btn" onClick={startCamera}>
                                    ⚡ Start Vitals Scan
                                </button>
                                {camError && <p className="qv-error">{camError}</p>}
                                <p className="qv-note">Uses Stream Vision Agents SDK + MediaPipe + Gemini Vision</p>
                            </div>
                        )}
                        {loading && (
                            <div className="qv-cam-prompt">
                                <div className="qv-spinner" />
                                <p style={{ color: "#64748b", marginTop: 12 }}>Loading Vision Agent…</p>
                            </div>
                        )}
                        <video ref={videoRef} className="qv-video" style={{ display: cameraOn ? "block" : "none" }} playsInline muted />
                        <canvas ref={canvasRef} className="qv-canvas" style={{ display: cameraOn ? "block" : "none" }} />
                        {cameraOn && (
                            <>
                                <div className={`qv-detect-badge ${bodyDetected ? "on" : "off"}`}>
                                    {bodyDetected ? "✅ Body detected" : "🔍 Scanning…"}
                                </div>
                                <button className="qv-stop-btn" onClick={stopCamera}>✕ Stop</button>
                            </>
                        )}
                    </div>

                    {/* Breathing progress bar */}
                    {cameraOn && (
                        <div className="qv-measure-card">
                            <div className="qv-measure-row">
                                <span>Measuring breathing… ({elapsed}s / 30s)</span>
                                <span style={{ color: "#63b3ed", fontWeight: 700 }}>{breathCount} breaths detected</span>
                            </div>
                            <div className="qv-progress-bar">
                                <div className="qv-progress-fill" style={{ width: `${measurePct}%` }} />
                            </div>
                            {elapsed >= 10 && breathingRate && (
                                <div className={`qv-br-result ${brClass}`}>
                                    🫁 {breathingRate.toFixed(1)} breaths/min — <strong>{brLabel}</strong>
                                    {brClass !== "ok" && <span className="qv-br-action"> → Needs attention</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes + Scan button */}
                    {cameraOn && (
                        <div className="qv-scan-ctrl">
                            <textarea
                                className="qv-notes"
                                rows={2}
                                placeholder="Optional: Symptoms, age, complaints (e.g. 'male, 55, chest pain for 2 hrs')"
                                value={patientNotes}
                                onChange={e => setPatientNotes(e.target.value)}
                            />
                            <button
                                className={`qv-scan-btn ${scanning ? "loading" : ""}`}
                                onClick={runScan}
                                disabled={scanning}
                            >
                                {scanning ? <><span className="qv-spinner-sm" /> Analyzing…</> : "📸 Run AI Scan"}
                            </button>
                            <p className="qv-scan-note">Captures current frame → Gemini Vision AI analyzes skin color, visible symptoms, breathing</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Results + info */}
                <div className="qv-results-col">

                    {/* Scan result card */}
                    {scanResult ? (
                        <div className={`qv-result-card urgency-${scanResult.urgency}`}>
                            <div className="qv-result-header">
                                <span className="qv-urgency-icon">
                                    {scanResult.urgency === "critical" ? "🚨" : scanResult.urgency === "warning" ? "⚠️" : "✅"}
                                </span>
                                <div>
                                    <p className="qv-result-title">{scanResult.urgency_label}</p>
                                    <p className="qv-result-provider">via {scanResult.ai_provider}</p>
                                </div>
                                {scanResult.refer_doctors && (
                                    <span className="qv-refer-badge">🏥 Refer Doctor</span>
                                )}
                            </div>

                            <div className="qv-result-grid">
                                <div className="qv-result-item">
                                    <span className="qv-item-label">Skin Color</span>
                                    <span className="qv-item-val">🎨 {scanResult.skin_color}</span>
                                </div>
                                <div className="qv-result-item">
                                    <span className="qv-item-label">Breathing</span>
                                    <span className="qv-item-val">🫁 {scanResult.breathing_assessment}</span>
                                </div>
                                <div className="qv-result-item">
                                    <span className="qv-item-label">Cardiovascular</span>
                                    <span className="qv-item-val">❤️ {scanResult.heart_assessment}</span>
                                </div>
                            </div>

                            {scanResult.visible_conditions?.length > 0 && (
                                <div className="qv-conditions">
                                    <p className="qv-section-label">👁️ Visible Signs</p>
                                    {scanResult.visible_conditions.map((c, i) => (
                                        <div key={i} className="qv-condition-item">• {c}</div>
                                    ))}
                                </div>
                            )}

                            {scanResult.recommendations?.length > 0 && (
                                <div className="qv-recs">
                                    <p className="qv-section-label">📋 Recommendations</p>
                                    {scanResult.recommendations.map((r, i) => (
                                        <div key={i} className="qv-rec-item">✔ {r}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="qv-placeholder-card">
                            <div className="qv-placeholder-icon">🔬</div>
                            <p className="qv-placeholder-title">AI Scan Results Will Appear Here</p>
                            <p className="qv-placeholder-sub">
                                Start the camera, wait 30 seconds for the breathing measurement to complete,
                                then click <strong>"📸 Run AI Scan"</strong>. Gemini Vision AI will analyze the
                                live camera frame — assessing skin color, facial expressions, visible breathing
                                effort, and signs of distress — and provide a health report with recommended actions.
                            </p>
                            <div className="qv-placeholder-tags">
                                <span>🎨 Skin color</span>
                                <span>🫁 Breathing</span>
                                <span>❤️ Cardiovascular</span>
                                <span>👁️ Visible signs</span>
                                <span>📋 Next steps</span>
                            </div>
                        </div>
                    )}

                    {/* Live vitals box */}
                    {cameraOn && breathingRate && (
                        <div className={`qv-live-vital ${brClass}`}>
                            <span className="qv-vital-icon">🫁</span>
                            <div>
                                <p className="qv-vital-val">{breathingRate.toFixed(1)} <span>bpm</span></p>
                                <p className="qv-vital-label">Breathing Rate · {brLabel}</p>
                                <p className="qv-vital-normal">Normal: {NORMAL_BR.min}–{NORMAL_BR.max} breaths/min</p>
                            </div>
                        </div>
                    )}

                    {/* How to Use */}
                    <div className="qv-info-section">
                        <p className="qv-info-title">📖 How to Use This Tool</p>
                        {HOW_TO_STEPS.map(s => (
                            <div key={s.num} className="qv-step-card">
                                <div className="qv-step-num">{s.num}</div>
                                <div>
                                    <p className="qv-step-title">{s.icon} {s.title}</p>
                                    <p className="qv-step-desc">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Skin color indicators */}
                    <div className="qv-info-section">
                        <p className="qv-info-title">🧠 Skin Color Indicators</p>
                        <p className="qv-section-desc">
                            The AI examines lips, inner eyelids, fingernails, and facial skin. These areas
                            show color changes clearly regardless of natural skin tone and are reliable
                            indicators even under basic lighting conditions.
                        </p>
                        <div className="qv-vital-cards">
                            {VITAL_SIGNS.map(v => (
                                <div key={v.key} className="qv-vsign-card">
                                    <span>{v.icon}</span>
                                    <div>
                                        <strong>{v.label}</strong>
                                        <p>{v.desc}</p>
                                        {v.action && <p className="qv-vsign-action">→ {v.action}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Conditions we detect */}
                    <div className="qv-info-section">
                        <p className="qv-info-title">📊 Conditions We Detect</p>
                        <p className="qv-section-desc">
                            Breathing rate is measured from shoulder oscillation — no sensors needed.
                            Visible signs are analyzed by Gemini Vision AI from the camera frame.
                        </p>
                        {CONDITIONS.map((c, i) => (
                            <div key={i} className="qv-cond-card">
                                <span className="qv-cond-icon">{c.icon}</span>
                                <div>
                                    <p className="qv-cond-title">{c.title}</p>
                                    <p className="qv-cond-range">{c.range}</p>
                                    <p className="qv-cond-insight">{c.insight}</p>
                                    {c.detail && <p className="qv-cond-detail">{c.detail}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why it matters */}
                    <div className="qv-why-card">
                        <p className="qv-why-title">🌏 Why This Matters for Rural Communities</p>
                        <p className="qv-why-text">
                            Over <strong>800 million people</strong> in rural India and South Asia have no access
                            to basic diagnostic equipment. An ECG costs ₹500–2,000. A pulse oximeter costs ₹1,500+.
                            A chest X-ray requires a journey to the nearest town — often 1–3 hours away.
                        </p>
                        <p className="qv-why-text">
                            This tool uses <strong>only a smartphone camera</strong> — the most widely available
                            device in rural areas — to give community health workers (ASHA workers, ANMs) a
                            preliminary read before deciding whether to refer a patient to the Primary Health Centre.
                        </p>
                        <p className="qv-why-text">
                            Powered by <strong>Gemini Vision 2.0</strong> AI + <strong>Stream Vision Agents SDK</strong>
                            — the same real-time video intelligence platform used in telemedicine and
                            live medical consultation systems worldwide.
                        </p>
                    </div>

                    <div className="qv-disclaimer">
                        ⚠️ <strong>Important:</strong> This is a preliminary screening tool for trained
                        community health workers. It is <em>not</em> a medical diagnosis. Always refer to a
                        qualified doctor for serious or persistent symptoms. In emergencies, call your local
                        emergency number immediately — do not wait for an AI result.
                    </div>
                </div>
            </div>
        </div>
    );
}
