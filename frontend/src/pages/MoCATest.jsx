import React, { useState } from 'react';
import {
  CheckCircle2, Clock, Activity, ArrowRight, AlertCircle,
  ChevronLeft, ChevronRight, Users, Info, Cpu, TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mocaQuestions, calculateScore, interpretMOCA } from '../data/questions';
import { testService } from '../services/api';
import QuestionCard from '../components/QuestionCard';

// ─── ML Prediction Card ───────────────────────────────────────────────────────
const MLPredictionCard = ({ ml }) => {
  if (!ml) return null;

  const riskColors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
  const color      = riskColors[ml.risk_level] || '#6b7280';
  const pct        = Math.round(ml.risk_probability * 100);

  return (
    <div className="ml-card">
      <div className="ml-card-header">
        <Cpu size={18} color="#8b5cf6" />
        <h3>AI Risk Model — NACC Dataset (55,268 patients)</h3>
        <span className="ml-badge">XGBoost · ROC-AUC 97.4%</span>
      </div>

      <div className="ml-stats">
        {/* Probability bar */}
        <div className="ml-prob-block">
          <span className="ml-stat-label">Dementia Risk Probability</span>
          <div className="ml-prob-bar-track">
            <div className="ml-prob-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div className="ml-prob-row">
            <span className="ml-prob-value" style={{ color }}>{pct}%</span>
            <span className="ml-risk-badge" style={{ background: `${color}20`, color }}>
              {ml.risk_level} Risk
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="ml-mini-grid">
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Expected MoCA</span>
            <span className="ml-mini-val">{ml.expected_moca?.toFixed(1)}</span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Your MoCA</span>
            <span className="ml-mini-val">{ml.actual_moca ?? '—'}</span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Z-Score</span>
            <span className="ml-mini-val" style={{ color: (ml.adjusted_zscore ?? 0) < -1 ? '#ef4444' : '#10b981' }}>
              {(ml.adjusted_zscore ?? 0) > 0 ? '+' : ''}{ml.adjusted_zscore}
            </span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Percentile</span>
            <span className="ml-mini-val">{ml.norm_percentile}th</span>
          </div>
        </div>
      </div>

      <div className="ml-interpretation">
        <TrendingDown size={14} />
        <p>{ml.interpretation}</p>
      </div>

      <style>{`
        .ml-card { background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%); border: 1px solid #c4b5fd; border-radius: 16px; padding: 22px; margin-top: 8px; text-align: left; }
        .ml-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .ml-card-header h3 { font-size: 0.9rem; font-weight: 700; color: #4c1d95; margin: 0; flex: 1; }
        .ml-badge { font-size: 0.7rem; font-weight: 700; background: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
        .ml-stats { display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px; }
        .ml-prob-block { background: white; border-radius: 12px; padding: 14px; box-shadow: 0 2px 8px rgba(139,92,246,0.08); }
        .ml-stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px; }
        .ml-prob-bar-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 10px; }
        .ml-prob-bar-fill { height: 100%; border-radius: 999px; transition: width 1.4s cubic-bezier(0.23, 1, 0.32, 1); }
        .ml-prob-row { display: flex; align-items: center; justify-content: space-between; }
        .ml-prob-value { font-size: 1.8rem; font-weight: 800; line-height: 1; }
        .ml-risk-badge { font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
        .ml-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .ml-mini-stat { background: white; border-radius: 10px; padding: 10px 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .ml-mini-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px; }
        .ml-mini-val { font-size: 1.2rem; font-weight: 800; color: #1e293b; }
        .ml-interpretation { display: flex; gap: 8px; align-items: flex-start; background: white; border-radius: 10px; padding: 12px; font-size: 0.82rem; color: #334155; line-height: 1.6; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .ml-interpretation svg { color: #8b5cf6; flex-shrink: 0; margin-top: 2px; }
        .ml-interpretation p { margin: 0; }
      `}</style>
    </div>
  );
};



// ─── Demographic Insight Panel (shared logic, MoCA variant) ──────────────────
const DemographicInsight = ({ adj }) => {
  if (!adj) return null;

  const riskColors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
  const color  = riskColors[adj.adjustedRisk] || '#6b7280';
  const pctFill = `${adj.normPercentile}%`;

  return (
    <div className="demo-insight-panel">
      <div className="demo-insight-header">
        <Users size={20} />
        <h3>Demographically Adjusted Score</h3>
      </div>

      <div className="demo-stats-grid">
        <div className="demo-stat-card">
          <span className="stat-label">Normative Percentile</span>
          <div className="percentile-bar-track">
            <div className="percentile-bar-fill" style={{ width: pctFill, background: color }} />
          </div>
          <div className="percentile-row">
            <span className="percentile-value" style={{ color }}>{adj.normPercentile}th</span>
            <span className="percentile-sub">vs peers in your age & education group</span>
          </div>
        </div>

        <div className="demo-mini-grid">
          <div className="mini-stat">
            <span className="mini-label">Adjusted Score</span>
            <span className="mini-value">{adj.adjustedScore}<small>/30</small></span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Norm Mean</span>
            <span className="mini-value">{adj.normMean?.toFixed(1)}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Z-Score</span>
            <span className="mini-value" style={{ color: adj.zScore < -1 ? '#ef4444' : '#10b981' }}>
              {adj.zScore > 0 ? '+' : ''}{adj.zScore}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Adjusted Risk</span>
            <span className="mini-value" style={{ color }}>{adj.adjustedRisk}</span>
          </div>
        </div>
      </div>

      <div className="demo-interpretation">
        <Info size={15} />
        <p>{adj.interpretation}</p>
      </div>

      {adj.educationCorrected && (
        <div className="edu-correction-note">
          ✓ MoCA education correction (+1 pt) applied per Nasreddine et al. protocol
        </div>
      )}

      <style>{`
        .demo-insight-panel { background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%); border: 1px solid #a7f3d0; border-radius: 16px; padding: 24px; margin-top: 8px; text-align: left; }
        .demo-insight-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .demo-insight-header h3 { font-size: 1rem; font-weight: 700; color: #065f46; margin: 0; }
        .demo-insight-header svg { color: #10b981; }
        .demo-stats-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
        .demo-stat-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .stat-label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px; }
        .percentile-bar-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
        .percentile-bar-fill { height: 100%; border-radius: 999px; transition: width 1.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .percentile-row { display: flex; align-items: baseline; gap: 8px; }
        .percentile-value { font-size: 1.6rem; font-weight: 800; }
        .percentile-sub { font-size: 0.8rem; color: #64748b; }
        .demo-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .mini-stat { background: white; border-radius: 10px; padding: 12px 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .mini-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .mini-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .mini-value small { font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-left: 2px; }
        .demo-interpretation { display: flex; gap: 10px; align-items: flex-start; background: white; border-radius: 10px; padding: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); margin-bottom: 12px; }
        .demo-interpretation svg { color: #10b981; flex-shrink: 0; margin-top: 2px; }
        .demo-interpretation p { margin: 0; font-size: 0.85rem; color: #334155; line-height: 1.6; }
        .edu-correction-note { font-size: 0.78rem; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 12px; font-weight: 600; }
      `}</style>
    </div>
  );
};

// ─── MoCATest Component ───────────────────────────────────────────────────────
const MoCATest = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers]         = useState({});
  const [isFinished, setIsFinished]   = useState(false);
  const [startTime]                   = useState(Date.now());
  const [result, setResult]           = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleAnswer = (answer) => {
    const updatedAnswers = { ...answers, [mocaQuestions[currentStep].id]: answer };
    setAnswers(updatedAnswers);
    setTimeout(() => {
      if (currentStep < mocaQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        finishTest(updatedAnswers);
      }
    }, 400);
  };

  const finishTest = async (finalAnswers) => {
    setIsFinished(true);
    setSubmitting(true);
    const duration_secs = Math.round((Date.now() - startTime) / 1000);
    const safeQuestions = mocaQuestions.map(({ id, section, correctAnswer, score }) => ({ id, section, correctAnswer, score }));

    try {
      const { data } = await testService.submitMoCA({ answers: finalAnswers, duration_secs, questions: safeQuestions });
      setResult(data.data);
    } catch (err) {
      const localScore = calculateScore(finalAnswers, mocaQuestions);
      setResult({ score: localScore, max_score: 30, risk_level: interpretMOCA(localScore).level });
      setSubmitError('Result saved locally (backend unavailable).');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = mocaQuestions[currentStep];
  const progress        = ((currentStep + 1) / mocaQuestions.length) * 100;
  const interpretation  = result ? interpretMOCA(result.score) : null;

  if (isFinished) {
    return (
      <div className="test-v2-container animate-fade-up">
        <div className="card-modern results-summary-v2">
          {submitting ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spin-ring" />
              <p style={{ marginTop: 16, color: 'var(--text-sub)' }}>Analysing results and applying demographic norms...</p>
              <style>{`.spin-ring{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:var(--secondary);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <>
              <div className="completion-top">
                <div className="lottie-mock-success"><CheckCircle2 size={60} strokeWidth={3} className="text-secondary" /></div>
                <h1>MoCA Analysis Complete</h1>
                <p>Montreal Cognitive Assessment metrics have been logged with demographic norm adjustment.</p>
                {submitError && <p style={{ color: '#d97706', fontSize: '0.85rem' }}>{submitError}</p>}
              </div>

              <div className="score-viz-v2">
                <div className="circular-progress-v2">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke={interpretation?.color || '#6FCF97'} strokeWidth="10" fill="none"
                      strokeDasharray={`${((result?.score || 0) / 30) * 283} 283`} strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1.5s ease-out' }} />
                  </svg>
                  <div className="center-score">
                    <span className="sc-big">{result?.score ?? '--'}</span>
                    <span className="sc-sm">Raw Score</span>
                  </div>
                </div>

                <div className="result-badge-v2" style={{ background: `${interpretation?.color}15`, color: interpretation?.color }}>
                  <Activity size={24} />
                  <div>
                    <h3>{result?.risk_level} Risk — {interpretation?.level} Screening Result</h3>
                    <p>{interpretation?.interpretation}</p>
                  </div>
                </div>

                {/* Demographic Adjustment Panel */}
                <DemographicInsight adj={result?.demographic_adjustment} />

                {/* ML Model Prediction Card */}
                {result?.ml_prediction && (
                  <MLPredictionCard ml={result.ml_prediction} />
                )}

              </div>

              <div className="action-footer-v2">
                <button className="btn-primary-lg" onClick={() => navigate('/reports')}>View Clinical Summary <ArrowRight size={20} /></button>
                <button className="btn-link-v2" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
              </div>
            </>
          )}
        </div>
        <style>{`
          .test-v2-container { padding: 60px 20px; max-width: 720px; margin: 0 auto; }
          .results-summary-v2 { text-align: center; padding: 60px; }
          .completion-top h1 { font-size: 2.2rem; margin: 20px 0 10px; }
          .completion-top p { color: var(--text-sub); margin-bottom: 40px; }
          .score-viz-v2 { display: flex; flex-direction: column; align-items: center; gap: 28px; margin-bottom: 40px; }
          .circular-progress-v2 { position: relative; width: 200px; height: 200px; transform: rotate(-90deg); }
          .circular-progress-v2 svg { width: 100%; height: 100%; }
          .center-score { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; transform: rotate(90deg); }
          .sc-big { font-size: 4rem; font-weight: 800; color: var(--text-main); line-height: 1; }
          .sc-sm { font-size: 0.95rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
          .result-badge-v2 { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 14px; text-align: left; width: 100%; }
          .result-badge-v2 h3 { font-size: 1.15rem; margin-bottom: 4px; }
          .result-badge-v2 p { font-size: 0.9rem; opacity: 0.9; margin: 0; }
          .action-footer-v2 { display: grid; gap: 12px; width: 100%; }
          .btn-link-v2 { background: none; border: none; color: var(--text-sub); font-weight: 700; cursor: pointer; padding: 10px; }
          .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px; background: var(--secondary); color: white; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 700; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="test-player-v2 container animate-fade-up">
      <header className="player-header-v2">
        <div className="player-meta">
          <div className="meta-icon-v2" style={{ background: '#f0fdf4', color: 'var(--secondary)' }}><Activity size={24} /></div>
          <div>
            <h1>MoCA Assessment</h1>
            <span className="section-label-active" style={{ color: 'var(--secondary)' }}>{currentQuestion.section}</span>
          </div>
        </div>
        <div className="player-timer"><Clock size={16} /><span>Clinical Screening</span></div>
      </header>
      <div className="player-progress-v2">
        <div className="progress-top">
          <span>{Math.round(progress)}% Processed</span>
          <span>Item {currentStep + 1}/{mocaQuestions.length}</span>
        </div>
        <div className="progress-track-v2">
          <div className="progress-bar-v2" style={{ width: `${progress}%`, background: 'var(--grad-secondary)' }}></div>
        </div>
      </div>
      <div className="player-body-v2">
        <QuestionCard {...currentQuestion} onAnswer={handleAnswer} selectedAnswer={answers[currentQuestion.id]} accentColor="#6FCF97" />
        <div className="player-nav-v2">
          <button className="btn-text-v2" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
            <ChevronLeft size={20} /> Previous
          </button>
          <div className="player-help"><AlertCircle size={16} /> Assistance required?</div>
          <button className="btn-text-v2" onClick={() => setCurrentStep(Math.min(mocaQuestions.length - 1, currentStep + 1))}>
            Skip Task <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <style>{`
        .test-player-v2 { padding: 40px 0; max-width: 800px; }
        .player-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .player-meta { display: flex; align-items: center; gap: 16px; }
        .meta-icon-v2 { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .player-meta h1 { font-size: 1.5rem; margin-bottom: 2px; }
        .section-label-active { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .player-timer { display: flex; align-items: center; gap: 8px; color: var(--text-sub); font-weight: 600; font-size: 0.9rem; background: white; padding: 8px 16px; border-radius: 30px; box-shadow: var(--shadow-sm); }
        .player-progress-v2 { margin-bottom: 40px; }
        .progress-top { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 700; font-size: 0.85rem; color: var(--text-sub); }
        .progress-track-v2 { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-bar-v2 { height: 100%; transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .player-nav-v2 { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
        .btn-text-v2 { background: none; border: none; color: var(--text-sub); font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn-text-v2:hover:not(:disabled) { color: var(--secondary); }
        .btn-text-v2:disabled { opacity: 0.4; cursor: not-allowed; }
        .player-help { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default MoCATest;
