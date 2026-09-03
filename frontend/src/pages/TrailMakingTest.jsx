import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RotateCcw, ArrowUpRight } from 'lucide-react';

// Trail Making Test Part A — connect numbers 1→25 in order
const TOTAL_DOTS   = 15;
const DOT_RADIUS   = 28;
const CANVAS_W     = 720;
const CANVAS_H     = 480;

// Seeded random positions for reproducibility
function generateDotPositions() {
  const dots = [];
  const margin = DOT_RADIUS + 20;
  const attempts = 1000;
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  for (let n = 1; n <= TOTAL_DOTS; n++) {
    let placed = false;
    for (let i = 0; i < attempts; i++) {
      const x = margin + rand() * (CANVAS_W - 2 * margin);
      const y = margin + rand() * (CANVAS_H - 2 * margin);
      const overlap = dots.some((d) => Math.hypot(d.x - x, d.y - y) < DOT_RADIUS * 2.8);
      if (!overlap) { dots.push({ n, x, y }); placed = true; break; }
    }
    if (!placed) dots.push({ n, x: margin + (n * 70) % (CANVAS_W - 2 * margin), y: margin });
  }
  return dots;
}

const DOTS = generateDotPositions();

const TrailMakingTest = () => {
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  const [step, setStep]       = useState(0);        // how many dots clicked correctly
  const [errors, setErrors]   = useState(0);
  const [phase, setPhase]     = useState('intro');  // intro | test | done
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [lastLine, setLastLine] = useState(null);   // { from, to }

  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'test') {
      setStartTime(Date.now());
      timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - Date.now()) / 1000)), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Live elapsed
  useEffect(() => {
    if (phase !== 'test') return;
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 500);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw completed lines
    for (let i = 1; i < step; i++) {
      const from = DOTS[i - 1];
      const to   = DOTS[i];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth   = 3;
      ctx.stroke();
    }

    // Draw dots
    DOTS.forEach((dot, idx) => {
      const completed = idx < step;
      const isNext    = idx === step;

      // Glow for next dot
      if (isNext) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = completed ? '#4a90e2' : isNext ? '#6366f1' : 'white';
      ctx.fill();
      ctx.strokeStyle = completed ? '#3b82f6' : isNext ? '#6366f1' : '#cbd5e1';
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      // Number label
      ctx.fillStyle  = completed || isNext ? 'white' : '#475569';
      ctx.font       = `bold ${DOT_RADIUS * 0.75}px Inter, sans-serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(dot.n), dot.x, dot.y);
    });
  }, [step]);

  useEffect(() => {
    if (phase === 'test') drawCanvas();
  }, [drawCanvas, phase]);

  const handleCanvasClick = (e) => {
    if (phase !== 'test') return;
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx     = (e.clientX - rect.left) * scaleX;
    const cy     = (e.clientY - rect.top)  * scaleY;

    const nextDot = DOTS[step];
    const dist    = Math.hypot(cx - nextDot.x, cy - nextDot.y);

    if (dist <= DOT_RADIUS + 12) {
      // Correct click
      const newStep = step + 1;
      setStep(newStep);
      if (newStep >= TOTAL_DOTS) {
        clearInterval(timerRef.current);
        setPhase('done');
      }
    } else {
      // Wrong dot — check if they clicked any wrong dot
      const wrongDot = DOTS.slice(step + 1).find(
        (d) => Math.hypot(cx - d.x, cy - d.y) <= DOT_RADIUS + 12
      );
      if (wrongDot) setErrors((e) => e + 1);
    }
  };

  const getScoreLabel = () => {
    const secs = elapsed;
    if (secs < 30  && errors === 0) return 'Excellent';
    if (secs < 60  && errors <= 1) return 'Normal';
    if (secs < 90  && errors <= 3) return 'Borderline';
    return 'Impaired';
  };

  const labelColor = { Excellent: '#10b981', Normal: '#3b82f6', Borderline: '#f59e0b', Impaired: '#ef4444' };

  return (
    <div className="tmt-page container animate-fade-up">
      <div className="tmt-header">
        <div className="tmt-icon"><ArrowUpRight size={28} /></div>
        <div>
          <h1>Trail Making Test — Part A</h1>
          <p>Click the numbered circles in order from <strong>1 → {TOTAL_DOTS}</strong>. Try to be as fast and accurate as possible.</p>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="intro-card card-modern">
          <h2>Instructions</h2>
          <ol className="intro-list">
            <li>You will see {TOTAL_DOTS} numbered circles scattered on the screen.</li>
            <li>Click them in numerical order starting from <strong>1</strong>.</li>
            <li>Work as quickly as you can — your time will be recorded.</li>
            <li>Each wrong click counts as an error — try to avoid them.</li>
          </ol>
          <div className="intro-preview">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`preview-dot ${n === 1 ? 'next' : n === 3 ? 'done' : ''}`}>{n}</div>
            ))}
            <span>→ Connect in order</span>
          </div>
          <button className="btn-start-tmt" onClick={() => setPhase('test')}>Begin Test</button>
        </div>
      )}

      {phase === 'test' && (
        <div className="test-area">
          <div className="tmt-hud">
            <div className="hud-item"><span>Next</span><strong>{step < TOTAL_DOTS ? DOTS[step].n : '✓'}</strong></div>
            <div className="hud-item"><span>Progress</span><strong>{step}/{TOTAL_DOTS}</strong></div>
            <div className="hud-item"><span>Errors</span><strong style={{ color: errors > 0 ? '#ef4444' : '#10b981' }}>{errors}</strong></div>
            <div className="hud-item"><span>Time</span><strong>{elapsed}s</strong></div>
          </div>
          <div className="canvas-container card-modern">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="tmt-canvas"
              onClick={handleCanvasClick}
            />
          </div>
          <div className="tmt-footer">
            <button className="btn-reset" onClick={() => { setStep(0); setErrors(0); setElapsed(0); setPhase('test'); }}>
              <RotateCcw size={16} /> Restart
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="done-card card-modern">
          <CheckCircle2 size={60} style={{ color: labelColor[getScoreLabel()] }} />
          <h2>Trail Making Complete!</h2>
          <div className="result-grid">
            <div className="res-item"><span>Time</span><strong>{elapsed}s</strong></div>
            <div className="res-item"><span>Errors</span><strong style={{ color: errors > 0 ? '#ef4444' : '#10b981' }}>{errors}</strong></div>
            <div className="res-item"><span>Classification</span>
              <strong style={{ color: labelColor[getScoreLabel()] }}>{getScoreLabel()}</strong>
            </div>
          </div>
          <p style={{ color: 'var(--text-sub)', maxWidth: 440, textAlign: 'center' }}>
            {getScoreLabel() === 'Excellent' || getScoreLabel() === 'Normal'
              ? 'Good processing speed and concentration demonstrated.'
              : 'Slower processing speed noted — further evaluation may be recommended.'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column', width: '100%' }}>
            <button className="btn-reports" onClick={() => navigate('/reports')}>View Reports <ArrowRight size={18} /></button>
            <button className="btn-retry" onClick={() => { setStep(0); setErrors(0); setElapsed(0); setPhase('test'); }}>Retry Test</button>
          </div>
        </div>
      )}

      <style>{`
        .tmt-page { padding: 40px 0; max-width: 880px; }
        .tmt-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .tmt-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .tmt-header h1 { font-size: 2rem; margin-bottom: 6px; }
        .tmt-header p { color: var(--text-sub); }
        .intro-card { padding: 48px; display: flex; flex-direction: column; gap: 24px; }
        .intro-card h2 { font-size: 1.8rem; }
        .intro-list { padding-left: 24px; display: flex; flex-direction: column; gap: 12px; color: var(--text-sub); line-height: 1.6; }
        .intro-list li { font-size: 1rem; }
        .intro-preview { display: flex; align-items: center; gap: 16px; background: var(--background); padding: 20px; border-radius: 12px; }
        .preview-dot { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; border: 2px solid #cbd5e1; color: #475569; background: white; }
        .preview-dot.next { background: #6366f1; color: white; border-color: #6366f1; }
        .preview-dot.done { background: #4a90e2; color: white; border-color: #4a90e2; }
        .intro-preview span { font-weight: 700; color: var(--text-sub); }
        .btn-start-tmt { padding: 16px 40px; background: var(--grad-primary); color: white; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
        .tmt-hud { display: flex; gap: 16px; margin-bottom: 16px; }
        .hud-item { background: white; padding: 14px 24px; border-radius: 12px; box-shadow: var(--shadow-sm); text-align: center; flex: 1; }
        .hud-item span { font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .hud-item strong { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }
        .canvas-container { padding: 0; overflow: hidden; border-radius: 16px; }
        .tmt-canvas { display: block; width: 100%; cursor: pointer; }
        .tmt-footer { margin-top: 16px; display: flex; justify-content: flex-end; }
        .btn-reset { display: flex; align-items: center; gap: 8px; background: none; border: 1.5px solid #e2e8f0; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; color: var(--text-sub); }
        .done-card { padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
        .done-card h2 { font-size: 2rem; }
        .result-grid { display: flex; gap: 24px; }
        .res-item { background: var(--background); padding: 20px 32px; border-radius: 14px; }
        .res-item span { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 8px; }
        .res-item strong { font-size: 1.8rem; font-weight: 800; }
        .btn-reports { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .btn-retry { padding: 12px; background: var(--background); border: none; border-radius: 12px; font-weight: 700; cursor: pointer; color: var(--text-sub); }
      `}</style>
    </div>
  );
};

export default TrailMakingTest;
