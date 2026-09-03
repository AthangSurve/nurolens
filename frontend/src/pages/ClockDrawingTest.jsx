import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RotateCcw, Clock, Info } from 'lucide-react';
import { testService } from '../services/api';

// Self-assessment scoring criteria for the clock drawing test
const CRITERIA = [
  { id: 'circle',   label: 'Drew a closed clock circle',                        points: 1 },
  { id: 'numbers',  label: 'Placed numbers 1–12 in correct positions',          points: 1 },
  { id: 'all12',    label: 'All 12 numbers present (none missing)',              points: 1 },
  { id: 'hands',    label: 'Drew exactly two clock hands',                       points: 1 },
  { id: 'time',     label: 'Hour hand points near 11, minute hand near 2 (10:10)', points: 1 },
];

const ClockDrawingTest = () => {
  const navigate      = useNavigate();
  const canvasRef     = useRef(null);
  const [drawing, setDrawing]     = useState(false);
  const [phase, setPhase]         = useState('draw'); // draw | assess | done
  const [checked, setChecked]     = useState({});
  const [result, setResult]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime]               = useState(Date.now());

  // Canvas drawing state
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw faint guide: outer circle suggestion
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Center dot
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [phase === 'draw']);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleSubmitDraw = () => setPhase('assess');

  const toggleCheck = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const handleFinalSubmit = async () => {
    const totalScore = CRITERIA.reduce((acc, c) => acc + (checked[c.id] ? c.points : 0), 0);
    setSubmitting(true);
    try {
      const duration_secs = Math.round((Date.now() - startTime) / 1000);
      const { data } = await testService.submitMMSE({
        answers:       { clock_drawing_score: totalScore },
        duration_secs,
        test_subtype:  'ClockDrawing',
        manual_score:  totalScore,
        max_score:     5,
      });
      setResult({ score: totalScore, label: totalScore >= 4 ? 'Normal' : totalScore >= 3 ? 'Borderline' : 'Impaired' });
    } catch {
      setResult({ score: totalScore, label: totalScore >= 4 ? 'Normal' : totalScore >= 3 ? 'Borderline' : 'Impaired' });
    } finally {
      setSubmitting(false);
      setPhase('done');
    }
  };

  const riskColor = { Normal: '#10b981', Borderline: '#f59e0b', Impaired: '#ef4444' };

  return (
    <div className="cdt-page container animate-fade-up">
      <div className="cdt-header">
        <div className="cdt-icon"><Clock size={28} /></div>
        <div>
          <h1>Clock Drawing Task</h1>
          <p>Draw a clock showing <strong>10:10</strong>. This assesses executive function and visuospatial ability.</p>
        </div>
      </div>

      {phase === 'draw' && (
        <div className="cdt-body">
          <div className="instruction-bar">
            <Info size={18} />
            <span>Draw the face of a clock with <strong>all 12 numbers</strong>, then set the time to <strong>ten minutes past eleven (10:10)</strong>.</span>
          </div>

          <div className="canvas-wrapper card-modern">
            <canvas
              ref={canvasRef}
              className="draw-canvas"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>

          <div className="cdt-actions">
            <button className="btn-clear" onClick={clearCanvas}><RotateCcw size={18} /> Clear</button>
            <button className="btn-next-step" onClick={handleSubmitDraw}>Done Drawing →</button>
          </div>
        </div>
      )}

      {phase === 'assess' && (
        <div className="assess-body card-modern">
          <h2>Self-Assessment Checklist</h2>
          <p>Based on your drawing, check all criteria you believe you satisfied:</p>
          <div className="criteria-list">
            {CRITERIA.map((c) => (
              <label key={c.id} className={`criterion-row ${checked[c.id] ? 'checked' : ''}`}>
                <input type="checkbox" checked={!!checked[c.id]} onChange={() => toggleCheck(c.id)} />
                <span className="crit-text">{c.label}</span>
                <span className="crit-pts">+{c.points} pt</span>
              </label>
            ))}
          </div>
          <div className="score-preview">
            Preliminary Score: <strong>{CRITERIA.reduce((a, c) => a + (checked[c.id] ? c.points : 0), 0)} / 5</strong>
          </div>
          <button className="btn-submit-cdt" onClick={handleFinalSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Submit Assessment'}
          </button>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="done-body card-modern">
          <CheckCircle2 size={56} style={{ color: riskColor[result.label] }} />
          <h2>Clock Drawing Complete</h2>
          <div className="done-score" style={{ color: riskColor[result.label] }}>
            {result.score} <small>/5</small>
          </div>
          <div className="done-label" style={{ background: riskColor[result.label] + '22', color: riskColor[result.label] }}>
            {result.label}
          </div>
          <p>{result.label === 'Normal' ? 'Excellent visuospatial and executive function demonstrated.' : result.label === 'Borderline' ? 'Some difficulty noted — a follow-up assessment may be recommended.' : 'Significant difficulty detected — please discuss with a specialist.'}</p>
          <div className="done-actions">
            <button className="btn-primary-lg" onClick={() => navigate('/reports')}>View Reports <ArrowRight size={18} /></button>
            <button className="btn-link" onClick={() => navigate('/tests')}>Back to Tests</button>
          </div>
        </div>
      )}

      <style>{`
        .cdt-page { padding: 40px 0; max-width: 800px; }
        .cdt-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .cdt-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .cdt-header h1 { font-size: 2rem; margin-bottom: 6px; }
        .cdt-header p { color: var(--text-sub); }
        .instruction-bar { display: flex; align-items: center; gap: 12px; background: #f0f4ff; border: 1px solid #c7d2fe; padding: 14px 20px; border-radius: 12px; margin-bottom: 24px; color: #4338ca; font-size: 0.9rem; font-weight: 500; }
        .canvas-wrapper { padding: 0; overflow: hidden; border-radius: 16px; }
        .draw-canvas { display: block; width: 100%; height: 480px; cursor: crosshair; touch-action: none; }
        .cdt-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
        .btn-clear { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border: 1.5px solid #e2e8f0; background: white; border-radius: 10px; font-weight: 700; cursor: pointer; color: var(--text-sub); }
        .btn-next-step { padding: 14px 32px; background: var(--grad-primary); color: white; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 700; cursor: pointer; }
        .assess-body { padding: 48px; display: flex; flex-direction: column; gap: 20px; }
        .assess-body h2 { font-size: 1.8rem; margin-bottom: 4px; }
        .assess-body > p { color: var(--text-sub); }
        .criteria-list { display: flex; flex-direction: column; gap: 10px; }
        .criterion-row { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .criterion-row input { width: 20px; height: 20px; accent-color: var(--primary); cursor: pointer; }
        .criterion-row.checked { background: #f0f7ff; border-color: var(--primary); }
        .crit-text { flex: 1; font-weight: 600; font-size: 0.95rem; }
        .crit-pts { font-weight: 800; color: var(--secondary); font-size: 0.9rem; }
        .score-preview { font-size: 1.1rem; color: var(--text-sub); font-weight: 600; padding: 16px 20px; background: var(--background); border-radius: 12px; }
        .score-preview strong { font-size: 1.4rem; color: var(--text-main); }
        .btn-submit-cdt { padding: 16px; background: var(--grad-primary); color: white; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
        .btn-submit-cdt:disabled { opacity: 0.6; cursor: not-allowed; }
        .done-body { padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
        .done-body h2 { font-size: 2rem; }
        .done-score { font-size: 4rem; font-weight: 800; line-height: 1; }
        .done-score small { font-size: 1.5rem; opacity: 0.6; }
        .done-label { padding: 8px 24px; border-radius: 20px; font-weight: 800; font-size: 1rem; }
        .done-body p { color: var(--text-sub); max-width: 440px; }
        .done-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: var(--primary); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; width: 100%; }
        .btn-link { background: none; border: none; color: var(--text-sub); font-weight: 700; cursor: pointer; padding: 10px; }
      `}</style>
    </div>
  );
};

export default ClockDrawingTest;
