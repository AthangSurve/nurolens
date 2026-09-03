import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  StopCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader,
  Info,
} from "lucide-react";
import { speechService } from "../services/api";

const ALL_SPEECH_PROMPTS = [
  {
    id: 1,
    title: "Your Day",
    icon: "☀️",
    instruction: "Please speak for 30–60 seconds about your day today.",
    detail:
      "Describe what you did, where you went, and how your day went. Speak naturally as if telling a friend.",
  },
  {
    id: 2,
    title: "A Favourite Memory",
    icon: "🌟",
    instruction:
      "Talk about your favourite memory or a memorable event in your life.",
    detail:
      "It can be a holiday, a celebration, or any moment that stands out to you. Speak for at least 30 seconds.",
  },
  {
    id: 3,
    title: "Your Favourite Meal",
    icon: "🍽️",
    instruction:
      "Explain how you would cook your favourite meal, step by step.",
    detail:
      "Describe the ingredients, how you prepare them, and how the dish tastes. Take your time and be as detailed as you like.",
  },
  {
    id: 4,
    title: "Your Hometown",
    icon: "🏘️",
    instruction: "Describe the town or city where you grew up.",
    detail:
      "Talk about what it looked like, notable places, and what life was like there. Share as much detail as you can.",
  },
  {
    id: 5,
    title: "A Family Member",
    icon: "👨‍👩‍👧",
    instruction: "Tell me about someone in your family who is special to you.",
    detail:
      "Describe who they are, what they look like, what you love about them, and a memory you share together.",
  },
  {
    id: 6,
    title: "Your Morning Routine",
    icon: "🌅",
    instruction:
      "Walk me through what you typically do every morning from the moment you wake up.",
    detail:
      "Describe each step in order — getting up, breakfast, getting ready — as if guiding someone new to your routine.",
  },
  {
    id: 7,
    title: "A Hobby or Interest",
    icon: "🎨",
    instruction:
      "Talk about a hobby or activity you enjoy doing in your free time.",
    detail:
      "Explain what it is, how you got started, why you enjoy it, and how often you do it.",
  },
  {
    id: 8,
    title: "Your Favourite Season",
    icon: "🍂",
    instruction:
      "Describe your favourite season of the year and why you like it.",
    detail:
      "Talk about the weather, what you do during that season, how it makes you feel, and any special events you associate with it.",
  },
  {
    id: 9,
    title: "A Childhood Memory",
    icon: "🧸",
    instruction:
      "Share a memory from your childhood that you remember vividly.",
    detail:
      "Describe where you were, who was with you, what happened, and why that memory has stayed with you.",
  },
  {
    id: 10,
    title: "Your Dream Holiday",
    icon: "✈️",
    instruction:
      "Describe your ideal holiday destination and what you would do there.",
    detail:
      "Talk about where you would go, who you would take, what you would see or eat, and why that place appeals to you.",
  },
  {
    id: 11,
    title: "A Favourite Book or Film",
    icon: "📖",
    instruction: "Tell me about a book, film, or TV show you really enjoyed.",
    detail:
      "Summarise what it is about, why you liked it, who you would recommend it to, and how it made you feel.",
  },
  {
    id: 12,
    title: "Your Career or Work",
    icon: "💼",
    instruction:
      "Talk about the kind of work you do or did during your career.",
    detail:
      "Describe your role, what a typical day involved, what you liked most about it, and any proud moments.",
  },
  {
    id: 13,
    title: "A Recent News Event",
    icon: "📰",
    instruction:
      "Describe a news story or current event you heard about recently.",
    detail:
      "Explain what happened, why it caught your attention, and what you think about it.",
  },
  {
    id: 14,
    title: "Your Neighbourhood",
    icon: "🏡",
    instruction: "Describe the neighbourhood or area where you currently live.",
    detail:
      "Talk about what it looks like, the people, nearby shops or parks, and what you like or dislike about it.",
  },
  {
    id: 15,
    title: "A Pet or Animal You Love",
    icon: "🐾",
    instruction:
      "Talk about a pet you have or an animal you are particularly fond of.",
    detail:
      "Describe the animal, its personality, funny or touching moments you have shared, and what it means to you.",
  },
  {
    id: 16,
    title: "A Special Celebration",
    icon: "🎉",
    instruction:
      "Describe a celebration or party that stands out in your memory.",
    detail:
      "It could be a birthday, wedding, or festival. Talk about what happened, who was there, and what made it special.",
  },
  {
    id: 17,
    title: "Your Favourite Sport or Game",
    icon: "⚽",
    instruction:
      "Talk about a sport, board game, or card game you enjoy or have played.",
    detail:
      "Explain the rules briefly, why you like it, memorable moments, and who you usually play with.",
  },
  {
    id: 18,
    title: "Your School Days",
    icon: "🏫",
    instruction: "Describe what school was like for you when you were young.",
    detail:
      "Talk about your teachers, subjects you liked or disliked, friends, and any memorable school events.",
  },
  {
    id: 19,
    title: "A Place You Have Visited",
    icon: "🗺️",
    instruction:
      "Tell me about a place you have visited that left a strong impression on you.",
    detail:
      "Describe what it looked like, what you did there, who you were with, and what you remember most vividly.",
  },
  {
    id: 20,
    title: "Your Favourite Music",
    icon: "🎵",
    instruction:
      "Talk about music you enjoy — a favourite song, artist, or genre.",
    detail:
      "Explain why that music appeals to you, any memories it brings back, and how it makes you feel.",
  },
  {
    id: 21,
    title: "Something You Are Proud Of",
    icon: "🏆",
    instruction:
      "Describe an achievement or moment in your life that you are particularly proud of.",
    detail:
      "Explain what you did, how long it took, what challenges you faced, and why it matters to you.",
  },
  {
    id: 22,
    title: "Your Daily Walk or Exercise",
    icon: "🚶",
    instruction:
      "Talk about your typical walk, exercise routine, or a favourite place you like to go outdoors.",
    detail:
      "Describe the route or location, what you see along the way, and how it makes you feel.",
  },
  {
    id: 23,
    title: "A Friend You Remember Fondly",
    icon: "🤝",
    instruction:
      "Tell me about a close friend — past or present — who means a lot to you.",
    detail:
      "Describe how you met, what you enjoy doing together, and a particular memory you share.",
  },
  {
    id: 24,
    title: "Your Favourite Fruit or Food",
    icon: "🍎",
    instruction:
      "Describe your all-time favourite fruit, snack, or comfort food.",
    detail:
      "Talk about what it tastes and smells like, where you first had it, and why you love it so much.",
  },
  {
    id: 25,
    title: "Technology in Your Life",
    icon: "📱",
    instruction:
      "Talk about how technology — phones, computers, or gadgets — has changed your life.",
    detail:
      "Describe what devices you use, what you use them for, what you find helpful or confusing, and how things were different before.",
  },
  {
    id: 26,
    title: "A Difficult Time You Overcame",
    icon: "💪",
    instruction:
      "Share a challenging period in your life and how you got through it.",
    detail:
      "Describe what was happening, how you felt, who helped you, and what you learned from the experience.",
  },
  {
    id: 27,
    title: "Your Ideal Day",
    icon: "🌈",
    instruction:
      "Describe what a perfect day would look like for you from morning to night.",
    detail:
      "Walk through each part of the day — where you would be, what you would do, who you would be with, and what you would eat.",
  },
  {
    id: 28,
    title: "Something You Wish You Learned Earlier",
    icon: "💡",
    instruction:
      "Talk about a skill or lesson you wish you had known when you were younger.",
    detail:
      "Explain what it is, how you eventually learned it, and how your life might have been different.",
  },
  {
    id: 29,
    title: "Your Relationship with Nature",
    icon: "🌿",
    instruction:
      "Describe how nature — gardens, parks, forests, the sea — features in your life.",
    detail:
      "Talk about your favourite natural setting, what you like doing there, and how spending time outdoors makes you feel.",
  },
  {
    id: 30,
    title: "A Family Tradition",
    icon: "🕯️",
    instruction: "Describe a tradition or ritual that your family has or had.",
    detail:
      "Explain what it involves, when it happens, where it comes from, and why it is meaningful to you.",
  },
];

// Return a shuffled subset of n items from an array
const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const SpeechTest = () => {
  const [phase, setPhase] = useState("idle"); // idle | prompt-select | recording | review | uploading | done | error | mode-select
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [hasPermission, setPerm] = useState(null);
  const [testMode, setTestMode] = useState(null); // 'upload' | 'record'
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [visiblePrompts, setVisiblePrompts] = useState([]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Set phase to mode-select initially
  useEffect(() => {
    setPhase("mode-select");
    setVisiblePrompts(pickRandom(ALL_SPEECH_PROMPTS, 3));
  }, []);

  // Request mic permission on mount (only if needed for recording)
  useEffect(() => {
    if (testMode === "record") {
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then((stream) => {
          setPerm(true);
          stream.getTracks().forEach((t) => t.stop()); // Stop immediately, just checking
        })
        .catch(() => setPerm(false));
    }
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [testMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "audio/wav" && !file.name.endsWith(".wav")) {
        setError("Please upload a .wav file for analysis.");
        setPhase("error");
        return;
      }
      chunksRef.current = [file];
      setDuration(0); // Optional: could try to get duration from file
      setPhase("review");
    }
  };

  const startRecording = async () => {
    try {
      setError("");
      setDuration(0);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setPhase("review");
      };

      recorder.start(100);
      setPhase("recording");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      setError(
        "Microphone access denied. Please grant permission in your browser settings.",
      );
      setPerm(false);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const submitRecording = async () => {
    setPhase("uploading");
    const blob =
      chunksRef.current[0] instanceof File
        ? chunksRef.current[0]
        : new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, blob.name || "speech-recording.webm");
    formData.append("duration_secs", String(duration));

    try {
      const { data } = await speechService.upload(formData);
      setResult(data.data);
      setPhase("done");
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again.",
      );
      setPhase("error");
    }
  };

  const formatTime = (s) =>
    s
      ? `${Math.floor(s / 60)
          .toString()
          .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`
      : "00:00";

  const getRiskColor = (risk) =>
    ({ Low: "#6FCF97", Moderate: "#F59E0B", High: "#EF4444" })[risk] ||
    "#4A90E2";

  return (
    <div className="speech-test-v2 container animate-fade-up">
      <div className="speech-header">
        <div
          className="icon-header-sq"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
        >
          <Mic size={28} />
        </div>
        <div>
          <h1>Vocal Biomarker Analysis</h1>
          <p>
            Speak naturally for 30–60 seconds. Our AI detects linguistic
            patterns indicative of cognitive change.
          </p>
        </div>
      </div>

      {/* Guidelines */}
      <div className="info-row">
        {[
          {
            icon: <Mic size={18} />,
            text: "Read aloud naturally — describe what you see or tell a story",
          },
          {
            icon: <Info size={18} />,
            text: "Ensure a quiet environment for best biomarker accuracy",
          },
          {
            icon: <CheckCircle2 size={18} />,
            text: "Minimum 30-second recording recommended for full analysis",
          },
        ].map((g, i) => (
          <div key={i} className="guideline-pill">
            <span className="guide-icon">{g.icon}</span>
            {g.text}
          </div>
        ))}
      </div>

      {/* Permission warning */}
      {hasPermission === false && testMode === "record" && (
        <div className="alert-block alert-warning">
          <AlertCircle size={20} />
          <span>
            Microphone permission denied. Please enable it in your browser and
            refresh.
          </span>
        </div>
      )}

      {error && phase === "error" && (
        <div className="alert-block alert-danger">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            className="btn-retry"
            onClick={() => setPhase("mode-select")}
            style={{
              marginLeft: "12px",
              background: "none",
              border: "1px solid currentColor",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="card-modern speech-card">
        {/* MODE SELECT */}
        {phase === "mode-select" && (
          <div className="phase-center">
            <div className="mic-bubble">
              <Mic size={48} />
            </div>
            <h2>Choose Assessment Method</h2>
            <p>
              Select how you would like to provide your speech sample for AI
              analysis.
            </p>
            <div className="mode-selection-grid">
              <button
                className="mode-btn record-mode"
                onClick={() => {
                  setTestMode("record");
                  setSelectedPrompt(null);
                  setVisiblePrompts(pickRandom(ALL_SPEECH_PROMPTS, 3));
                  setPhase("prompt-select");
                }}
              >
                <Mic size={32} />
                <span>Record Session</span>
                <p>Start a new audio recording directly in your browser.</p>
              </button>
              <button
                className="mode-btn upload-mode"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} />
                <span>Upload File</span>
                <p>Select an existing .wav audio file from your device.</p>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".wav"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* PROMPT SELECT */}
        {phase === "prompt-select" && (
          <div className="phase-center">
            <div className="mic-bubble">
              <Mic size={48} />
            </div>
            <h2>Choose a Speaking Topic</h2>
            <p className="prompt-select-subtitle">
              Select one of the topics below and speak about it naturally for at
              least <strong>30 seconds</strong>.
            </p>
            <div className="prompt-options-grid">
              {visiblePrompts.map((p) => (
                <button
                  key={p.id}
                  className={`prompt-option-card ${selectedPrompt?.id === p.id ? "selected" : ""}`}
                  onClick={() => setSelectedPrompt(p)}
                >
                  <span className="prompt-option-icon">{p.icon}</span>
                  <strong className="prompt-option-title">{p.title}</strong>
                  <p className="prompt-option-instruction">{p.instruction}</p>
                </button>
              ))}
            </div>
            {selectedPrompt && (
              <div className="selected-prompt-preview">
                <span className="preview-icon">{selectedPrompt.icon}</span>
                <div>
                  <p className="preview-instruction">
                    <strong>{selectedPrompt.instruction}</strong>
                  </p>
                  <p className="preview-detail">{selectedPrompt.detail}</p>
                </div>
              </div>
            )}
            <div className="prompt-select-actions">
              <button
                className="btn-shuffle-prompts"
                onClick={() => {
                  setSelectedPrompt(null);
                  setVisiblePrompts(pickRandom(ALL_SPEECH_PROMPTS, 3));
                }}
              >
                🔀 Show Different Topics
              </button>
              <button
                className="btn-record-start"
                onClick={() => setPhase("idle")}
                disabled={!selectedPrompt}
              >
                <Mic size={20} /> Continue to Recording
              </button>
              <button
                className="btn-back"
                onClick={() => setPhase("mode-select")}
                style={{
                  marginTop: "10px",
                  color: "var(--text-sub)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* IDLE */}
        {phase === "idle" && (
          <div className="phase-center">
            <div className="mic-bubble">
              <Mic size={48} />
            </div>
            <h2>Ready to Record</h2>
            {selectedPrompt && (
              <div className="test-prompt-card">
                <div className="prompt-label">
                  📋 Your Topic — {selectedPrompt.icon} {selectedPrompt.title}
                </div>
                <p className="prompt-sentence">{selectedPrompt.instruction}</p>
                <p className="prompt-instruction">{selectedPrompt.detail}</p>
                <p className="prompt-instruction">
                  Speak naturally for at least <strong>30 seconds</strong> for
                  accurate analysis.
                </p>
              </div>
            )}
            <button
              className="btn-record-start"
              onClick={startRecording}
              disabled={hasPermission === false}
            >
              <Mic size={20} /> Begin Voice Assessment
            </button>
            <button
              className="btn-back"
              onClick={() => setPhase("prompt-select")}
              style={{
                marginTop: "12px",
                color: "var(--text-sub)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Change Topic
            </button>
          </div>
        )}

        {/* RECORDING */}
        {phase === "recording" && (
          <div className="phase-center">
            <div className="mic-bubble recording-pulse">
              <Mic size={48} />
            </div>
            <div className="timer-display">{formatTime(duration)}</div>
            {selectedPrompt && (
              <div className="recording-prompt-reminder">
                <span>{selectedPrompt.icon}</span>
                <span>{selectedPrompt.instruction}</span>
              </div>
            )}
            {duration < 30 && (
              <p className="recording-hint recording-min-hint">
                🎙 Keep speaking — aim for at least 30 seconds ({30 - duration}s
                remaining)
              </p>
            )}
            {duration >= 30 && (
              <p className="recording-hint recording-good-hint">
                ✅ Great! You can stop when you're ready.
              </p>
            )}
            <div className="wave-visual">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
            <button className="btn-record-stop" onClick={stopRecording}>
              <StopCircle size={20} /> Stop Recording
            </button>
          </div>
        )}

        {/* REVIEW */}
        {phase === "review" && (
          <div className="phase-center">
            <div className="review-icon">
              <CheckCircle2 size={52} className="text-secondary" />
            </div>
            <h2>
              {chunksRef.current[0] instanceof File
                ? "File Ready"
                : "Recording Complete"}
            </h2>
            <p>
              {chunksRef.current[0] instanceof File
                ? `File: ${chunksRef.current[0].name}`
                : `Duration: ${formatTime(duration)} · Audio captured successfully`}
            </p>
            <div className="review-actions">
              <button className="btn-submit-speech" onClick={submitRecording}>
                <Upload size={20} /> Submit for AI Analysis
              </button>
              <button
                className="btn-rerecord"
                onClick={() => setPhase("mode-select")}
              >
                Choose Different
              </button>
            </div>
          </div>
        )}

        {/* UPLOADING */}
        {phase === "uploading" && (
          <div className="phase-center">
            <Loader size={52} className="text-primary spin-icon" />
            <h2>Analyzing Vocal Biomarkers</h2>
            <p>Our neural network is processing your speech patterns...</p>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && result && (
          <div className="results-grid-speech">
            <div className="results-header-speech">
              <CheckCircle2 size={40} className="text-secondary" />
              <h2>Analysis Complete</h2>
              <p style={{ color: "var(--text-sub)" }}>
                Vocal biomarker assessment logged to your profile.
              </p>
            </div>
            <div className="biomarker-cards">
              {[
                {
                  label: "Speech Stability",
                  value: `${result.stability_pct}%`,
                  caption: "Neural coherence index",
                  color: getRiskColor(result.risk_level),
                },
                {
                  label: "Temporal Jitter",
                  value: `${result.jitter_f0}%`,
                  caption: "F0 perturbation ratio",
                  color: "#4A90E2",
                },
                {
                  label: "Neural Latency",
                  value: `${result.neural_latency}ms`,
                  caption: "Vocal processing speed",
                  color: "#8B5CF6",
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="biomarker-card"
                  style={{ borderTop: `3px solid ${m.color}` }}
                >
                  <p className="bio-label">{m.label}</p>
                  <span className="bio-value" style={{ color: m.color }}>
                    {m.value}
                  </span>
                  <p className="bio-caption">{m.caption}</p>
                </div>
              ))}
            </div>
            <div
              className="risk-result-speech"
              style={{
                background: `${getRiskColor(result.risk_level)}15`,
                border: `1px solid ${getRiskColor(result.risk_level)}30`,
              }}
            >
              <strong style={{ color: getRiskColor(result.risk_level) }}>
                Risk Level: {result.risk_level}
              </strong>
              <p>{result.analysis_notes}</p>
            </div>
            <button
              className="btn-rerecord"
              onClick={() => {
                setPhase("mode-select");
                setResult(null);
              }}
            >
              Start Another Analysis
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .speech-test-v2 {
          padding: 40px 0;
          max-width: 800px;
        }
        .speech-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }
        .icon-header-sq {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .speech-header h1 {
          font-size: 2rem;
          margin-bottom: 6px;
        }
        .speech-header p {
          color: var(--text-sub);
        }
        .info-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .guideline-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 16px;
          border-radius: 30px;
          box-shadow: var(--shadow-sm);
          font-size: 0.85rem;
          color: var(--text-sub);
          font-weight: 500;
        }
        .guide-icon {
          color: var(--primary);
          flex-shrink: 0;
        }
        .alert-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .alert-warning {
          background: #fff7ed;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .alert-danger {
          background: #fff1f2;
          color: #9f1239;
          border: 1px solid #fecdd3;
        }
        .speech-card {
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .phase-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
          width: 100%;
        }
        .phase-center h2 {
          font-size: 2rem;
        }
        .phase-center p {
          color: var(--text-sub);
          max-width: 480px;
        }
        .mode-selection-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 20px;
          width: 100%;
          max-width: 600px;
        }
        .mode-btn {
          background: var(--surface-alt);
          border-radius: 20px;
          padding: 32px 24px;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transition: all 0.3s;
          color: var(--primary);
        }
        .mode-btn span {
          font-weight: 800;
          font-size: 1.25rem;
        }
        .mode-btn p {
          font-size: 0.85rem;
          color: var(--text-sub);
        }
        .mode-btn:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          background: #fdfefe;
        }
        .mic-bubble {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--surface-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
        .spin-icon {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .recording-pulse {
          animation: recordPulse 1.5s infinite;
          background: #fff1f2;
          color: #ef4444;
        }
        @keyframes recordPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(239, 68, 68, 0);
          }
        }
        .timer-display {
          font-size: 3.5rem;
          font-weight: 800;
          color: #ef4444;
          letter-spacing: 0.05em;
        }
        .recording-hint {
          font-size: 0.95rem;
          color: var(--text-sub);
          font-style: italic;
        }
        .wave-visual {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 50px;
        }
        .wave-bar {
          width: 4px;
          background: linear-gradient(to top, var(--primary), #8b5cf6);
          border-radius: 2px;
          animation: waveAnim 0.8s ease-in-out infinite alternate;
        }
        @keyframes waveAnim {
          0% {
            height: 8px;
          }
          100% {
            height: 40px;
          }
        }
        .btn-record-start {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: var(--grad-primary);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-record-start:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .test-prompt-card {
          background: linear-gradient(135deg, #f0f4ff, #f8fbff);
          border: 1.5px solid #bfdbfe;
          border-radius: 16px;
          padding: 20px 24px;
          max-width: 520px;
          text-align: left;
        }
        .prompt-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--primary, #4a90e2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        .prompt-sentence {
          font-size: 1rem;
          color: #1e293b;
          font-style: italic;
          line-height: 1.6;
          margin-bottom: 14px;
          font-weight: 600;
        }
        .prompt-picture {
          margin-bottom: 14px;
        }
        .cookie-scene {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .scene-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        .scene-hint {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }
        .prompt-instruction {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
        .btn-record-stop {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: #fff1f2;
          color: #ef4444;
          border: 1px solid #fecdd3;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .review-icon {
          color: var(--secondary);
        }
        .review-actions {
          display: flex;
          gap: 16px;
        }
        .btn-submit-speech {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--secondary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-rerecord {
          padding: 12px 24px;
          background: var(--surface-alt);
          color: var(--text-main);
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .results-grid-speech {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }
        .results-header-speech {
          text-align: center;
        }
        .results-header-speech h2 {
          font-size: 1.8rem;
        }
        .biomarker-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
        }
        .biomarker-card {
          background: var(--background);
          padding: 24px;
          border-radius: 16px;
          text-align: center;
        }
        .bio-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .bio-value {
          font-size: 2.2rem;
          font-weight: 800;
        }
        .bio-caption {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .risk-result-speech {
          width: 100%;
          padding: 20px 24px;
          border-radius: 14px;
          text-align: center;
        }
        .risk-result-speech p {
          margin-top: 6px;
          color: var(--text-sub);
          font-size: 0.9rem;
        }
        /* ── Prompt Selection ── */
        .prompt-select-subtitle {
          color: var(--text-sub);
          max-width: 480px;
        }
        .prompt-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 720px;
        }
        @media (max-width: 600px) {
          .prompt-options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .prompt-option-card {
          background: var(--surface-alt);
          border: 2px solid transparent;
          border-radius: 18px;
          padding: 24px 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: all 0.25s;
          text-align: center;
          color: var(--text-main);
        }
        .prompt-option-card:hover {
          border-color: var(--primary);
          transform: translateY(-3px);
          background: #fdfefe;
        }
        .prompt-option-card.selected {
          border-color: var(--primary);
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
        }
        .prompt-option-icon {
          font-size: 2rem;
        }
        .prompt-option-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--primary);
        }
        .prompt-option-instruction {
          font-size: 0.8rem;
          color: var(--text-sub);
          line-height: 1.5;
          margin: 0;
        }
        .selected-prompt-preview {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: linear-gradient(135deg, #f0f4ff, #f8fbff);
          border: 1.5px solid #bfdbfe;
          border-radius: 14px;
          padding: 16px 20px;
          max-width: 540px;
          text-align: left;
        }
        .selected-prompt-preview span:first-child {
          font-size: 1.8rem;
          flex-shrink: 0;
        }
        .preview-instruction {
          font-size: 0.95rem;
          color: #1e293b;
          margin: 0 0 4px;
        }
        .preview-detail {
          font-size: 0.83rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        .prompt-select-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .btn-shuffle-prompts {
          padding: 10px 22px;
          background: var(--surface-alt);
          color: var(--text-sub);
          border: 1.5px dashed #94a3b8;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-shuffle-prompts:hover {
          background: #f1f5f9;
          color: var(--primary);
          border-color: var(--primary);
        }
        /* ── Recording reminder & hints ── */
        .recording-prompt-reminder {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f4ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e3a5f;
          max-width: 480px;
        }
        .recording-prompt-reminder span:first-child {
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .recording-min-hint {
          color: #f59e0b;
          font-weight: 600;
          font-style: normal;
        }
        .recording-good-hint {
          color: #16a34a;
          font-weight: 600;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default SpeechTest;
