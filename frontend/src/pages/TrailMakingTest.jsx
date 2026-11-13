import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, RotateCcw, ArrowUpRight, Zap,
  Layers, ShieldAlert, Award, Brain, Clock, AlertTriangle
} from 'lucide-react';
import { testService } from '../services/api';

const CANVAS_W = 760;
const CANVAS_H = 500;
const DOT_RADIUS = 26;

// Difficulty tiers
const DIFFICULTY_LEVELS = [
  {
    id: 'easy',
    name: 'Easy (Trail A - 8 Nodes)',
    desc: 'Connect numbers 1 → 8 in numerical sequence.',
    nodes: ['1', '2', '3', '4', '5', '6', '7', '8'],
    normExpectedSecs: 18,
    type: 'Sequential Numeric'
  },
  {
    id: 'medium',
    name: 'Medium (Trail A - 15 Nodes)',
    desc: 'Connect numbers 1 → 15 in numerical sequence (Standard TMT-A).',
    nodes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    normExpectedSecs: 32,
    type: 'Standard Halstead-Reitan'
  },
  {
    id: 'hard',
    name: 'Hard (Trail B - Alternating 1-A-2-B)',
    desc: 'Alternate between numbers and letters: 1 → A → 2 → B → 3 → C → 4 → D → 5 → E → 6 → F.',
    nodes: ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E', '6', 'F'],
    normExpectedSecs: 48,
    type: 'Executive Set-Shifting (TMT-B)'
  }
];

// Dynamically generate non-overlapping random node positions on canvas
function generateRandomDots(nodeLabels) {
  const dots = [];
  const margin = DOT_RADIUS + 28;
  const maxAttempts = 1500;
  const count = nodeLabels.length;

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = margin + Math.random() * (CANVAS_W - 2 * margin);
      const y = margin + Math.random() * (CANVAS_H - 2 * margin);
      // Ensure distance from every other placed dot
      const collides = dots.some((d) => Math.hypot(d.x - x, d.y - y) < DOT_RADIUS * 2.7);
      if (!collides) {
        dots.push({ id: i, label: nodeLabels[i], x, y });
        placed = true;
        break;
      }
    }
    // Fallback if random attempts fail: grid jitter
    if (!placed) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = margin + col * ((CANVAS_W - 2 * margin) / 4) + (Math.random() * 20 - 10);
      const y = margin + row * ((CANVAS_H - 2 * margin) / 4) + (Math.random() * 20 - 10);
      dots.push({ id: i, label: nodeLabels[i], x, y });
    }
  }
  return dots;
}

const TrailMakingTest = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [dots, setDots]                             = useState([]);
  const [step, setStep]                             = useState(0);       // correct dots clicked
  const [errors, setErrors]                         = useState(0);
  const [phase, setPhase]                           = useState('intro'); // 'intro' | 'test' | 'done'
  const [elapsed, setElapsed]                       = useState(0);
  const [submitting, setSubmitting]                 = useState(false);
  const [result, setResult]                         = useState(null);
  const [wrongClickFlash, setWrongClickFlash]       = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const currentLevel = DIFFICULTY_LEVELS.find((l) => l.id === selectedDifficulty) || DIFFICULTY_LEVELS[1];
  const totalDots = currentLevel.nodes.length;

  // Start test with newly randomized pattern
  const handleStartTest = () => {
    const randomized = generateRandomDots(currentLevel.nodes);
    setDots(randomized);
    setStep(0);
    setErrors(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setPhase('test');
  };

  // Live timer
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Render canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dots.length === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Canvas background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle grid dots
    ctx.fillStyle = '#e2e8f0';
    for (let gx = 30; gx < CANVAS_W; gx += 40) {
      for (let gy = 30; gy < CANVAS_H; gy += 40) {
        ctx.fillRect(gx, gy, 2, 2);
      }
    }

    // Connecting lines between completed nodes
    for (let i = 1; i < step; i++) {
      const from = dots[i - 1];
      const to   = dots[i];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw all dots
    dots.forEach((dot, idx) => {
      const isCompleted = idx < step;
      const isNext      = idx === step;
      const isWrongFlash = wrongClickFlash && wrongClickFlash.id === idx;

      // Glow ring for the next expected node
      if (isNext) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS + 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);

      if (isWrongFlash) {
        ctx.fillStyle = '#fee2e2';
        ctx.strokeStyle = '#ef4444';
      } else if (isCompleted) {
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#2563eb';
      } else if (isNext) {
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#4f46e5';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
      }

      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dot label
      ctx.fillStyle = isCompleted || isNext ? '#ffffff' : '#334155';
      ctx.font = `bold ${DOT_RADIUS * 0.76}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dot.label, dot.x, dot.y);
    });
  }, [step, dots, wrongClickFlash]);

  useEffect(() => {
    if (phase === 'test') {
      drawCanvas();
    }
  }, [drawCanvas, phase]);

  // Click on canvas
  const handleCanvasClick = (e) => {
    if (phase !== 'test' || step >= dots.length) return;
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx     = (e.clientX - rect.left) * scaleX;
    const cy     = (e.clientY - rect.top) * scaleY;

    const nextDot = dots[step];
    const dist = Math.hypot(cx - nextDot.x, cy - nextDot.y);

    if (dist <= DOT_RADIUS + 12) {
      // Correct click
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep >= totalDots) {
        clearInterval(timerRef.current);
        const finalTime = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        finishTest(finalTime, errors);
      }
    } else {
      // Check if user clicked any other incorrect circle
      const clickedDot = dots.find((d, idx) => idx !== step && Math.hypot(cx - d.x, cy - d.y) <= DOT_RADIUS + 12);
      if (clickedDot) {
        setErrors((err) => err + 1);
        setWrongClickFlash(clickedDot);
        setTimeout(() => setWrongClickFlash(null), 600);
      }
    }
  };

  // Submit test and persist to database
  const finishTest = async (finalTime, finalErrors) => {
    setSubmitting(true);
    const expected = currentLevel.normExpectedSecs;
    const timeDelta = finalTime - expected;

    let classification = 'Optimal';
    let percentile = 92;

    if (finalTime <= expected && finalErrors === 0) {
      classification = 'Optimal';
      percentile = 94;
    } else if (finalTime <= expected * 1.35 && finalErrors <= 1) {
      classification = 'Normal';
      percentile = 78;
    } else if (finalTime <= expected * 1.85 && finalErrors <= 3) {
      classification = 'Borderline';
      percentile = 46;
    } else {
      classification = 'Slowed';
      percentile = 22;
    }

    const calculatedScore = Math.max(10, Math.min(100, Math.round(100 - (finalTime * 0.8) - (finalErrors * 5))));

    const suggestions = [];
    if (finalErrors > 1) {
      suggestions.push('Practice visual-spatial scanning drills (word searches, hidden object finding) to lower target selection errors.');
    }
    if (selectedDifficulty === 'hard') {
      suggestions.push('Engage in cognitive set-shifting games (e.g. Stroop tasks, alternating card sorting) to enhance mental flexibility.');
    } else {
      suggestions.push('Challenge yourself next with Hard Mode (Trail B alternating letters and numbers) to exercise executive switching.');
    }
    suggestions.push('Aerobic exercise 3x/week significantly improves motor coordination and visual processing speed.');

    const summaryResult = {
      difficulty: currentLevel.name,
      level_id: selectedDifficulty,
      duration_secs: finalTime,
      errors: finalErrors,
      total_dots: totalDots,
      classification,
      score: calculatedScore,
      percentile,
      suggestions,
    };

    try {
      await testService.submitTrail(summaryResult);
    } catch (err) {
      console.error('[Trail Test Submit Error]', err);
    } finally {
      setResult(summaryResult);
      setSubmitting(false);
      setPhase('done');
    }
  };

  const riskColor = { Optimal: '#10b981', Normal: '#3b82f6', Borderline: '#f59e0b', Slowed: '#ef4444' };

  return (
    <div className="tmt-page container animate-fade-up">
      {/* Header */}
      <div className="tmt-header">
        <div className="tmt-icon"><ArrowUpRight size={28} /></div>
        <div>
          <h1>Trail Making Test (TMT)</h1>
          <p>
            Standardized psychomotor speed and executive set-shifting test.
            Measures visual scanning, motor coordination, and mental flexibility.
          </p>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="intro-card card-modern">
          <h2>Select Hardness Level</h2>
          <p>Choose your test tier. Dots will be generated with a dynamic, non-overlapping randomized layout.</p>

          <div className="difficulty-grid">
            {DIFFICULTY_LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                className={`diff-card ${selectedDifficulty === lvl.id ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(lvl.id)}
              >
                <div className="diff-top">
                  <span className="diff-type">{lvl.type}</span>
                  {selectedDifficulty === lvl.id && <span className="diff-active-check">✓ Active</span>}
                </div>
                <h3>{lvl.name}</h3>
                <p>{lvl.desc}</p>
                <div className="diff-preview">
                  {lvl.nodes.slice(0, 4).map((nd, idx) => (
                    <span key={idx} className="preview-bubble">{nd}</span>
                  ))}
                  <span>... → {lvl.nodes[lvl.nodes.length - 1]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="instruction-box">
            <h4>Instructions</h4>
            <ol>
              <li>Click each circle in exact target sequence as fast as you can without making errors.</li>
              <li>Connected blue lines will draw automatically as you progress.</li>
              <li>If you click the wrong circle, an error will be flagged and penalized.</li>
              <li>Each run randomizes position patterns — no two rounds are identical.</li>
            </ol>
          </div>

          <button className="btn-start-tmt" onClick={handleStartTest}>
            <Zap size={18} /> Begin Randomized Assessment →
          </button>
        </div>
      )}

      {phase === 'test' && (
        <div className="test-area">
          {/* HUD Bar */}
          <div className="tmt-hud">
            <div className="hud-item highlight">
              <span>Next Target</span>
              <strong>{step < totalDots ? dots[step]?.label : 'Done!'}</strong>
            </div>
            <div className="hud-item">
              <span>Progress</span>
              <strong>{step} / {totalDots}</strong>
            </div>
            <div className="hud-item">
              <span>Errors</span>
              <strong style={{ color: errors > 0 ? '#ef4444' : '#10b981' }}>{errors}</strong>
            </div>
            <div className="hud-item">
              <span>Elapsed</span>
              <strong>{elapsed}s</strong>
            </div>
          </div>

          {/* Canvas */}
          <div className="canvas-container card-modern">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="tmt-canvas"
              onClick={handleCanvasClick}
            />
          </div>

          {/* Action Row */}
          <div className="tmt-footer">
            <span className="tmt-hint">
              Level: <strong>{currentLevel.name}</strong> · Click circles in order
            </span>
            <button className="btn-reset" onClick={handleStartTest}>
              <RotateCcw size={16} /> Re-shuffle & Restart
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="done-card card-modern">
          <CheckCircle2 size={60} style={{ color: riskColor[result.classification] }} />
          <h2>Trail Making Assessment Complete!</h2>
          <div
            className="classification-pill"
            style={{
              background: riskColor[result.classification] + '1a',
              color: riskColor[result.classification],
              border: `1.5px solid ${riskColor[result.classification]}`
            }}
          >
            Speed Classification: {result.classification}
          </div>

          <div className="result-grid">
            <div className="res-item">
              <span>Completion Time</span>
              <strong>{result.duration_secs}s</strong>
            </div>
            <div className="res-item">
              <span>Errors</span>
              <strong style={{ color: result.errors > 0 ? '#ef4444' : '#10b981' }}>
                {result.errors}
              </strong>
            </div>
            <div className="res-item">
              <span>Percentile Rank</span>
              <strong>{result.percentile}th %</strong>
            </div>
            <div className="res-item">
              <span>Executive Score</span>
              <strong>{result.score} / 100</strong>
            </div>
          </div>

          {/* Detailed Suggestions */}
          <div className="suggestions-box">
            <h4><Brain size={18} color="#6366f1" /> Performance Insights & Cognitive Exercises</h4>
            <ul>
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="done-actions">
            <button className="btn-reports" onClick={() => navigate('/reports')}>
              View Complete Clinical Records <ArrowRight size={18} />
            </button>
            <button className="btn-retry" onClick={() => { setPhase('intro'); }}>
              Test Another Difficulty Level
            </button>
            <button className="btn-link" onClick={() => navigate('/tests')}>
              Back to Diagnostic Suite
            </button>
          </div>
        </div>
      )}

      <style>{`
        .tmt-page { padding: 40px 0 80px; max-width: 900px; }
        .tmt-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .tmt-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 16px rgba(245,158,11,0.25); }
        .tmt-header h1 { font-size: 2.2rem; margin-bottom: 6px; }
        .tmt-header p { color: var(--text-sub); font-size: 1.05rem; }

        /* Intro Screen */
        .intro-card { padding: 40px; display: flex; flex-direction: column; gap: 24px; }
        .intro-card h2 { font-size: 1.8rem; margin: 0; }
        .intro-card > p { color: var(--text-sub); margin: 0; }

        .difficulty-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 8px 0; }
        .diff-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; transition: var(--transition); background: #ffffff; display: flex; flex-direction: column; gap: 8px; }
        .diff-card:hover { border-color: #6366f1; transform: translateY(-2px); }
        .diff-card.active { border-color: #6366f1; background: #f5f3ff; box-shadow: 0 6px 16px rgba(99,102,241,0.15); }
        .diff-top { display: flex; justify-content: space-between; align-items: center; }
        .diff-type { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #6366f1; }
        .diff-active-check { font-size: 0.75rem; font-weight: 800; color: #10b981; }
        .diff-card h3 { font-size: 1.05rem; margin: 0; color: var(--text-main); }
        .diff-card p { font-size: 0.85rem; color: var(--text-sub); margin: 0; line-height: 1.4; flex: 1; }
        .diff-preview { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; }
        .preview-bubble { width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #334155; font-size: 0.75rem; }

        .instruction-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; }
        .instruction-box h4 { margin: 0 0 10px; font-size: 1rem; color: #1e293b; }
        .instruction-box ol { margin: 0; padding-left: 20px; color: var(--text-sub); font-size: 0.92rem; line-height: 1.6; }

        .btn-start-tmt { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 36px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; box-shadow: 0 6px 16px rgba(79,70,229,0.3); transition: var(--transition); }
        .btn-start-tmt:hover { transform: translateY(-1px); }

        /* HUD */
        .tmt-hud { display: flex; gap: 16px; margin-bottom: 16px; }
        .hud-item { background: white; padding: 14px 20px; border-radius: 14px; box-shadow: var(--shadow-sm); text-align: center; flex: 1; border: 1px solid #e2e8f0; }
        .hud-item.highlight { background: #eef2ff; border-color: #c7d2fe; }
        .hud-item span { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .hud-item strong { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
        .hud-item.highlight strong { color: #4338ca; }

        /* Canvas */
        .canvas-container { padding: 0; overflow: hidden; border-radius: 20px; border: 2px solid #e2e8f0; box-shadow: var(--shadow-sm); }
        .tmt-canvas { display: block; width: 100%; cursor: pointer; }

        .tmt-footer { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
        .tmt-hint { font-size: 0.9rem; color: var(--text-sub); }
        .btn-reset { display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #e2e8f0; padding: 10px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; color: var(--text-sub); }
        .btn-reset:hover { background: #f8fafc; color: var(--text-main); }

        /* Done Screen */
        .done-card { padding: 48px 40px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
        .done-card h2 { font-size: 2.2rem; margin: 0; }
        .classification-pill { padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 0.95rem; }
        .result-grid { display: flex; gap: 16px; width: 100%; }
        .res-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 24px; border-radius: 14px; flex: 1; text-align: center; }
        .res-item span { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 6px; }
        .res-item strong { font-size: 1.8rem; font-weight: 800; color: var(--text-main); }

        .suggestions-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: left; width: 100%; }
        .suggestions-box h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 1rem; color: #1e293b; }
        .suggestions-box ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; color: var(--text-sub); font-size: 0.92rem; line-height: 1.5; }

        .done-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 8px; }
        .btn-reports { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; }
        .btn-retry { padding: 14px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; font-weight: 700; cursor: pointer; color: var(--text-main); }
        .btn-link { background: none; border: none; color: var(--text-sub); font-weight: 700; cursor: pointer; padding: 8px; }

        @media (max-width: 768px) {
          .difficulty-grid { grid-template-columns: 1fr; }
          .result-grid { flex-direction: column; }
          .tmt-hud { flex-wrap: wrap; }
          .hud-item { min-width: 45%; }
        }
      `}</style>
    </div>
  );
};

export default TrailMakingTest;
