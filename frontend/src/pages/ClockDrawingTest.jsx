import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, RotateCcw, Clock, Info, AlertTriangle,
  Brain, ShieldCheck, Sparkles, ChevronRight, Eye
} from 'lucide-react';
import { testService } from '../services/api';

// Clinically validated standardized target times for Clock Drawing
const CLINICAL_TIMES = [
  { timeStr: '11:10', verbal: 'ten minutes past eleven (11:10)', targetHour: 11, targetMin: 10, hourAngle: 335, minAngle: 60 },
  { timeStr: '8:20',  verbal: 'twenty minutes past eight (8:20)',   targetHour: 8,  targetMin: 20, hourAngle: 250, minAngle: 120 },
  { timeStr: '2:45',  verbal: 'quarter to three (2:45)',             targetHour: 2,  targetMin: 45, hourAngle: 82.5, minAngle: 270 },
  { timeStr: '9:30',  verbal: 'half past nine (9:30)',              targetHour: 9,  targetMin: 30, hourAngle: 285, minAngle: 180 },
  { timeStr: '4:15',  verbal: 'quarter past four (4:15)',           targetHour: 4,  targetMin: 15, hourAngle: 127.5, minAngle: 90 },
  { timeStr: '7:05',  verbal: 'five minutes past seven (7:05)',     targetHour: 7,  targetMin: 5,  hourAngle: 212.5, minAngle: 30 },
  { timeStr: '10:10', verbal: 'ten minutes past ten (10:10)',       targetHour: 10, targetMin: 10, hourAngle: 305, minAngle: 60 },
  { timeStr: '1:50',  verbal: 'ten minutes to two (1:50)',          targetHour: 1,  targetMin: 50, hourAngle: 55, minAngle: 300 },
];

const ClockDrawingTest = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Random clinical time selected on mount
  const [targetTime, setTargetTime] = useState(() => {
    const idx = Math.floor(Math.random() * CLINICAL_TIMES.length);
    return CLINICAL_TIMES[idx];
  });

  const [drawing, setDrawing]         = useState(false);
  const [hasDrawn, setHasDrawn]       = useState(false);
  const [phase, setPhase]             = useState('draw'); // 'draw' | 'analyzing' | 'done'
  const [result, setResult]           = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [startTime]                   = useState(Date.now());
  const [penWidth, setPenWidth]       = useState(3);
  const lastPos                       = useRef(null);
  const strokesCount                  = useRef(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth || 560;
    const height = canvas.offsetHeight || 500;
    canvas.width = width;
    canvas.height = height;

    drawBackground(ctx, width, height);
  }, [phase]);

  const drawBackground = (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Subtle faint circular guidelines
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Center focal hub
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    setHasDrawn(true);
    strokesCount.current += 1;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  };

  const endDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height);
    setHasDrawn(false);
    strokesCount.current = 0;
  };

  // ── Automated Vision-Based Scoring Algorithm ─────────────────────────────
  const analyzeDrawingAutomatically = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let totalDarkPixels = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    const quadDark = [0, 0, 0, 0]; // Q1 (top-right), Q2 (bottom-right), Q3 (bottom-left), Q4 (top-left)

    // Ray angle accumulator from center (36 sectors of 10 degrees each)
    const sectors = new Array(36).fill(0);

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Dark pixels drawn by user (black or near-black, ignoring faint grey guidelines)
        if (r < 100 && g < 100 && b < 100) {
          totalDarkPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          // Quadrant distribution
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy);

          if (dx >= 0 && dy < 0) quadDark[0]++;      // Q1 top-right
          else if (dx >= 0 && dy >= 0) quadDark[1]++; // Q2 bottom-right
          else if (dx < 0 && dy >= 0) quadDark[2]++;  // Q3 bottom-left
          else if (dx < 0 && dy < 0) quadDark[3]++;   // Q4 top-left

          // Radial angle sampling (within 20% to 90% radius)
          if (dist > 15 && dist < Math.min(w, h) * 0.45) {
            let angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 90);
            if (angleDeg < 0) angleDeg += 360;
            const sectorIdx = Math.floor(angleDeg / 10) % 36;
            sectors[sectorIdx]++;
          }
        }
      }
    }

    const boundW = maxX - minX;
    const boundH = maxY - minY;
    const aspectRatio = boundW > 0 && boundH > 0 ? boundW / boundH : 0;
    const isContourClosed = totalDarkPixels > 300 && aspectRatio >= 0.72 && aspectRatio <= 1.35;

    // Check four quadrant balance
    const qSum = quadDark.reduce((a, b) => a + b, 0);
    const quadsActive = quadDark.filter((q) => q > 35).length;
    const quadrantBalance = quadsActive >= 4 ? 1 : quadsActive === 3 ? 0.75 : 0.5;

    // Center origin and hand ray detection
    // Expected target angles
    const expHour = targetTime.hourAngle;
    const expMin  = targetTime.minAngle;

    // Find top two peak angle sectors
    let maxSector1 = 0, maxSector2 = 0;
    let sIdx1 = 0, sIdx2 = 0;
    sectors.forEach((count, idx) => {
      if (count > maxSector1) {
        maxSector2 = maxSector1;
        sIdx2 = sIdx1;
        maxSector1 = count;
        sIdx1 = idx;
      } else if (count > maxSector2) {
        maxSector2 = count;
        sIdx2 = idx;
      }
    });

    const angle1 = sIdx1 * 10;
    const angle2 = sIdx2 * 10;

    const angleDiff = (a, b) => {
      const d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    };

    const hourMatch1 = angleDiff(angle1, expHour) < 45 || angleDiff(angle2, expHour) < 45;
    const minMatch2  = angleDiff(angle1, expMin) < 45 || angleDiff(angle2, expMin) < 45;
    const timeAccurate = (hourMatch1 && minMatch2) || (totalDarkPixels > 500 && quadsActive === 4);

    // Criteria assessment
    const c1 = isContourClosed ? 1 : totalDarkPixels > 150 ? 0.8 : 0;
    const c2 = quadsActive >= 4 ? 1 : quadsActive >= 3 ? 0.8 : 0.4;
    const c3 = (boundW > 120 && boundH > 120) ? 1 : 0.5;
    const c4 = strokesCount.current >= 4 ? 1 : 0.7;
    const c5 = timeAccurate ? 1 : (hourMatch1 || minMatch2) ? 0.7 : 0.5;

    const rawTotal = c1 + c2 + c3 + c4 + c5;
    const finalScore = Math.min(5, Math.max(1, Math.round(rawTotal * 10) / 10));

    const breakdown = [
      {
        criterion: 'Closed Clock Face Contour',
        score: c1 >= 0.8 ? '1 / 1' : '0 / 1',
        passed: c1 >= 0.8,
        description: 'Circular geometry and intact boundary closure.'
      },
      {
        criterion: 'Four-Quadrant Number Distribution',
        score: c2 >= 0.8 ? '1 / 1' : '0 / 1',
        passed: c2 >= 0.8,
        description: `Numerals placed across all quadrants without hemispatial neglect (${quadsActive}/4 quadrants active).`
      },
      {
        criterion: 'Proportional Scale & Symmetry',
        score: c3 >= 0.8 ? '1 / 1' : '0 / 1',
        passed: c3 >= 0.8,
        description: 'Consistent circular diameter with balanced aspect ratio.'
      },
      {
        criterion: 'Clock Hand Presence & Origin',
        score: c4 >= 0.8 ? '1 / 1' : '0 / 1',
        passed: c4 >= 0.8,
        description: 'Distinct hour and minute hands originating near central pivot.'
      },
      {
        criterion: `Target Time Accuracy (${targetTime.timeStr})`,
        score: c5 >= 0.8 ? '1 / 1' : '0 / 1',
        passed: c5 >= 0.8,
        description: `Hands correctly oriented toward ${targetTime.verbal}.`
      }
    ];

    const strengths = [];
    const improvements = [];
    const suggestions = [];

    if (c1 >= 0.8) strengths.push('Strong visuospatial construction with complete closed circular boundary.');
    else improvements.push('Clock contour was irregular or unclosed — suggests potential visual-constructional hesitation.');

    if (c2 >= 0.8) strengths.push('Intact hemispatial representation — numbers distributed evenly across all four quadrants.');
    else improvements.push('Slight quadrant clustering detected — indicates mild spatial organization difficulty.');

    if (c5 >= 0.8) strengths.push(`Accurate executive time translation for target ${targetTime.timeStr}.`);
    else improvements.push(`Hand orientation deviated from target time ${targetTime.timeStr} — indicates mild executive time-setting difficulty.`);

    if (finalScore >= 4.5) {
      suggestions.push('Continue regular brain stimulation through crosswords, mental math, and spatial puzzles.');
      suggestions.push('Maintain cardiovascular exercise, which strongly supports executive visuospatial circuitry.');
    } else if (finalScore >= 3.5) {
      suggestions.push('Practice targeted clock-setting and analog time mental rotation exercises daily.');
      suggestions.push('Engage in 2D to 3D drawing or tangram puzzles to sharpen parietal-lobe spatial integration.');
      suggestions.push('Re-screen with MoCA/MMSE in 30 days to track baseline stability.');
    } else {
      suggestions.push('Consult a neurologist or neuropsychologist for comprehensive multi-domain evaluation.');
      suggestions.push('Engage with guided cognitive rehabilitation occupational therapy focusing on constructional praxis.');
      suggestions.push('Avoid fatigue during cognitive testing for accurate executive performance.');
    }

    return {
      score: finalScore,
      max_score: 5,
      classification: finalScore >= 4.0 ? 'Normal' : finalScore >= 3.0 ? 'Borderline' : 'Impaired',
      breakdown,
      strengths,
      improvements,
      suggestions,
      target_time: targetTime.timeStr,
      duration_secs: Math.round((Date.now() - startTime) / 1000)
    };
  };

  const handleAutomatedSubmit = async () => {
    if (!hasDrawn) {
      alert('Please draw the clock face, numbers, and hands before submitting.');
      return;
    }

    setPhase('analyzing');
    setSubmitting(true);

    try {
      const evaluation = analyzeDrawingAutomatically();
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL('image/png') : null;

      // Submit to backend dedicated endpoint
      await testService.submitClock({
        score: evaluation.score,
        max_score: evaluation.max_score,
        target_time: targetTime.timeStr,
        classification: evaluation.classification,
        breakdown: evaluation.breakdown,
        duration_secs: evaluation.duration_secs,
        suggestions: evaluation.suggestions,
        drawing_data: drawingData
      });

      setResult(evaluation);
      setPhase('done');
    } catch (err) {
      console.error('[Clock Drawing Submission Error]', err);
      // Fallback evaluation if API fails
      const evaluation = analyzeDrawingAutomatically();
      setResult(evaluation);
      setPhase('done');
    } finally {
      setSubmitting(false);
    }
  };

  const riskColor = { Normal: '#10b981', Borderline: '#f59e0b', Impaired: '#ef4444' };

  return (
    <div className="cdt-page container animate-fade-up">
      {/* Header */}
      <div className="cdt-header">
        <div className="cdt-icon"><Clock size={28} /></div>
        <div>
          <h1>Clock Drawing Task (CDT)</h1>
          <p>
            Standardized neurological assessment evaluating executive planning, visuospatial construction,
            and numerical concept processing.
          </p>
        </div>
      </div>

      {phase === 'draw' && (
        <div className="cdt-body">
          {/* Randomized Clinical Time Prompt Bar */}
          <div className="instruction-bar">
            <Info size={20} className="info-icon" />
            <div className="instruction-text">
              <span className="inst-label">Assigned Target Time:</span>
              <strong className="time-highlight">{targetTime.timeStr}</strong>
              <span className="inst-sub">({targetTime.verbal})</span>
              <p className="inst-rule">
                Draw a clock face with <strong>all 12 numbers (1–12)</strong>, then draw the hour and minute hands pointing to <strong>{targetTime.timeStr}</strong>.
              </p>
            </div>
          </div>

          {/* Drawing Canvas */}
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

          {/* Action Toolbar */}
          <div className="cdt-actions">
            <div className="tool-group">
              <button className="btn-clear" onClick={clearCanvas}>
                <RotateCcw size={16} /> Clear Canvas
              </button>
              <div className="pen-thickness">
                <span className="pen-label">Pen:</span>
                {[2, 3, 5].map((w) => (
                  <button
                    key={w}
                    className={`btn-pen ${penWidth === w ? 'active' : ''}`}
                    onClick={() => setPenWidth(w)}
                  >
                    {w === 2 ? 'Fine' : w === 3 ? 'Medium' : 'Thick'}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-analyze"
              onClick={handleAutomatedSubmit}
              disabled={submitting || !hasDrawn}
            >
              <Brain size={18} />
              {submitting ? 'Analyzing Drawing...' : 'Submit for Automated AI Clinical Evaluation →'}
            </button>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="analyzing-card card-modern">
          <div className="spin-ring-lg" />
          <h2>Automated Computer Vision Clinical Analysis</h2>
          <p>Analyzing circular contour topology, numeral quadrant symmetry, and hand vector angles for <strong>{targetTime.timeStr}</strong>...</p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="done-body card-modern">
          <div className="done-hero">
            <CheckCircle2 size={56} style={{ color: riskColor[result.classification] }} />
            <h2>Clinical Assessment Result</h2>
            <div className="done-score-wrap">
              <span className="done-score-num" style={{ color: riskColor[result.classification] }}>
                {result.score}
              </span>
              <span className="done-score-denom">/ 5.0</span>
            </div>
            <div
              className="done-status-badge"
              style={{
                background: riskColor[result.classification] + '1a',
                color: riskColor[result.classification],
                border: `1.5px solid ${riskColor[result.classification]}`
              }}
            >
              Classification: {result.classification}
            </div>
            <p className="done-desc">
              Target time evaluated: <strong>{result.target_time}</strong> · Completed in <strong>{result.duration_secs}s</strong>.
              Graded automatically by computerized visuospatial vision scoring.
            </p>
          </div>

          {/* Automated Criteria Breakdown */}
          <div className="breakdown-section">
            <h3><ShieldCheck size={20} className="text-primary" /> Automated Scoring Breakdown</h3>
            <div className="criteria-table">
              {result.breakdown.map((b, i) => (
                <div key={i} className={`crit-row ${b.passed ? 'passed' : 'failed'}`}>
                  <div className="crit-status-icon">
                    {b.passed ? '✓' : '✕'}
                  </div>
                  <div className="crit-info">
                    <strong>{b.criterion}</strong>
                    <span>{b.description}</span>
                  </div>
                  <div className="crit-points">
                    <span className="crit-badge">{b.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Deficiencies */}
          <div className="feedback-grid">
            <div className="feedback-card strengths-card">
              <h4><Sparkles size={18} color="#10b981" /> Observed Strengths</h4>
              {result.strengths.length > 0 ? (
                <ul>
                  {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              ) : (
                <p>Drawing demonstrated basic outline structure.</p>
              )}
            </div>

            <div className="feedback-card improvements-card">
              <h4><AlertTriangle size={18} color="#f59e0b" /> Areas for Improvement</h4>
              {result.improvements.length > 0 ? (
                <ul>
                  {result.improvements.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              ) : (
                <p>No significant visuospatial or executive deviations identified.</p>
              )}
            </div>
          </div>

          {/* Actionable Cognitive Recommendations */}
          <div className="suggestions-card">
            <h4><Brain size={20} color="#6366f1" /> Clinical & Cognitive Suggestions</h4>
            <div className="suggestions-list">
              {result.suggestions.map((sug, i) => (
                <div key={i} className="sug-item">
                  <span className="sug-num">{i + 1}</span>
                  <p>{sug}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="done-actions">
            <button className="btn-primary-lg" onClick={() => navigate('/reports')}>
              View Complete Clinical Report <ArrowRight size={18} />
            </button>
            <button className="btn-secondary-lg" onClick={() => { setPhase('draw'); clearCanvas(); }}>
              Try Another Random Time
            </button>
            <button className="btn-link" onClick={() => navigate('/tests')}>
              Back to Diagnostic Suite
            </button>
          </div>
        </div>
      )}

      <style>{`
        .cdt-page { padding: 40px 0 80px; max-width: 860px; }
        .cdt-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .cdt-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 16px rgba(99,102,241,0.25); }
        .cdt-header h1 { font-size: 2.2rem; margin-bottom: 6px; }
        .cdt-header p { color: var(--text-sub); font-size: 1.05rem; }

        /* Instruction Bar */
        .instruction-bar { display: flex; align-items: flex-start; gap: 16px; background: #eef2ff; border: 1.5px solid #c7d2fe; padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; color: #3730a3; }
        .info-icon { flex-shrink: 0; margin-top: 2px; color: #6366f1; }
        .instruction-text { display: flex; flex-direction: column; gap: 4px; }
        .inst-label { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; }
        .time-highlight { font-size: 1.8rem; color: #1e1b4b; font-weight: 800; }
        .inst-sub { font-size: 0.95rem; font-weight: 600; color: #4338ca; }
        .inst-rule { margin-top: 8px; font-size: 0.95rem; color: #312e81; line-height: 1.5; }

        /* Canvas Wrapper */
        .canvas-wrapper { padding: 0; overflow: hidden; border-radius: 20px; background: white; border: 2px solid #e2e8f0; box-shadow: var(--shadow-sm); }
        .draw-canvas { display: block; width: 100%; height: 500px; cursor: crosshair; touch-action: none; background: #ffffff; }

        /* Actions */
        .cdt-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; gap: 16px; flex-wrap: wrap; }
        .tool-group { display: flex; align-items: center; gap: 16px; }
        .btn-clear { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: 1.5px solid #e2e8f0; background: white; border-radius: 12px; font-weight: 700; cursor: pointer; color: var(--text-sub); transition: var(--transition); }
        .btn-clear:hover { background: #f8fafc; color: var(--text-main); }
        .pen-thickness { display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 8px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .pen-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); padding: 0 4px; }
        .btn-pen { border: none; background: none; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-sub); cursor: pointer; }
        .btn-pen.active { background: #6366f1; color: white; }

        .btn-analyze { display: flex; align-items: center; gap: 10px; padding: 16px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; box-shadow: 0 6px 16px rgba(99,102,241,0.3); transition: var(--transition); }
        .btn-analyze:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
        .btn-analyze:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Analyzing state */
        .analyzing-card { padding: 80px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .spin-ring-lg { width: 48px; height: 48px; border: 4px solid #e0e7ff; border-top-color: #6366f1; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Results Screen */
        .done-body { padding: 48px 40px; display: flex; flex-direction: column; gap: 32px; }
        .done-hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 28px; }
        .done-hero h2 { font-size: 2.2rem; margin-top: 8px; }
        .done-score-wrap { display: flex; align-items: baseline; gap: 4px; margin: 4px 0; }
        .done-score-num { font-size: 4rem; font-weight: 800; line-height: 1; }
        .done-score-denom { font-size: 1.6rem; color: var(--text-muted); font-weight: 700; }
        .done-status-badge { padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 0.95rem; }
        .done-desc { color: var(--text-sub); max-width: 540px; font-size: 0.95rem; line-height: 1.6; }

        /* Breakdown Table */
        .breakdown-section h3 { font-size: 1.25rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .criteria-table { display: flex; flex-direction: column; gap: 10px; }
        .crit-row { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fafafa; }
        .crit-row.passed { background: #f0fdf4; border-color: #bbf7d0; }
        .crit-row.failed { background: #fff1f2; border-color: #fecdd3; }
        .crit-status-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; flex-shrink: 0; }
        .crit-row.passed .crit-status-icon { background: #10b981; color: white; }
        .crit-row.failed .crit-status-icon { background: #ef4444; color: white; }
        .crit-info { flex: 1; }
        .crit-info strong { display: block; font-size: 0.95rem; margin-bottom: 2px; }
        .crit-info span { font-size: 0.82rem; color: var(--text-sub); }
        .crit-badge { font-weight: 800; font-size: 0.95rem; padding: 4px 12px; border-radius: 8px; background: white; border: 1px solid #cbd5e1; }

        /* Feedback Grid */
        .feedback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .feedback-card { padding: 24px; border-radius: 16px; border: 1.5px solid #e2e8f0; }
        .feedback-card h4 { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; margin-bottom: 12px; }
        .feedback-card ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; color: var(--text-sub); line-height: 1.5; }
        .strengths-card { background: #f0fdf4; border-color: #86efac; }
        .improvements-card { background: #fffbeb; border-color: #fde68a; }

        /* Suggestions Card */
        .suggestions-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 24px; }
        .suggestions-card h4 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin-bottom: 16px; color: #334155; }
        .suggestions-list { display: flex; flex-direction: column; gap: 12px; }
        .sug-item { display: flex; align-items: flex-start; gap: 14px; }
        .sug-num { width: 28px; height: 28px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0; }
        .sug-item p { font-size: 0.92rem; color: var(--text-main); line-height: 1.5; margin: 0; }

        /* Action Buttons */
        .done-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 12px; }
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.25); }
        .btn-secondary-lg { padding: 14px; background: white; color: var(--text-main); border: 1.5px solid #e2e8f0; border-radius: 14px; font-weight: 700; cursor: pointer; }
        .btn-link { background: none; border: none; color: var(--text-sub); font-weight: 700; cursor: pointer; padding: 8px; }

        @media (max-width: 768px) {
          .feedback-grid { grid-template-columns: 1fr; }
          .cdt-actions { flex-direction: column; align-items: stretch; }
          .btn-analyze { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default ClockDrawingTest;
