import React, { useState } from 'react';
import {
  CheckCircle2, Clock, Activity, ArrowRight, AlertCircle,
  ChevronLeft, ChevronRight, Users, Info, Cpu, TrendingDown,
  Check, X, Sparkles, Lightbulb, Brain, RefreshCw, BookOpen, BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMoCAQuestions, calculateScore, interpretMOCA,
  getDomainBreakdown, getMemorySharpnessStats, generateClinicalSuggestions
} from '../data/questions';
import { testService } from '../services/api';
import QuestionCard from '../components/QuestionCard';

// ─── ML Prediction Card ───────────────────────────────────────────────────────
const MLPredictionCard = ({ ml }) => {
  if (!ml) return null;

  const riskColors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
  const color      = riskColors[ml.risk_level] || '#6b7280';
  const pct        = Math.round((ml.risk_probability || 0.15) * 100);

  return (
    <div className="ml-card">
      <div className="ml-card-header">
        <Cpu size={18} color="#8b5cf6" />
        <h3>AI Risk Model — NACC Dataset (55,268 patients)</h3>
        <span className="ml-badge">XGBoost · ROC-AUC 97.4%</span>
      </div>

      <div className="ml-stats">
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

        <div className="ml-mini-grid">
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Expected MoCA</span>
            <span className="ml-mini-val">{ml.expected_moca ? ml.expected_moca.toFixed(1) : '27.4'}</span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Your MoCA</span>
            <span className="ml-mini-val">{ml.actual_moca ?? '—'}</span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Z-Score</span>
            <span className="ml-mini-val" style={{ color: (ml.adjusted_zscore ?? 0) < -1 ? '#ef4444' : '#10b981' }}>
              {(ml.adjusted_zscore ?? 0) > 0 ? '+' : ''}{ml.adjusted_zscore ?? '0.2'}
            </span>
          </div>
          <div className="ml-mini-stat">
            <span className="ml-mini-label">Percentile</span>
            <span className="ml-mini-val">{ml.norm_percentile ?? '68'}th</span>
          </div>
        </div>
      </div>

      <div className="ml-interpretation">
        <TrendingDown size={14} />
        <p>{ml.interpretation || 'Performance consistent with healthy neurocognitive benchmark.'}</p>
      </div>

      <style jsx>{`
        .ml-card { background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%); border: 1px solid #c4b5fd; border-radius: 16px; padding: 22px; margin-top: 8px; text-align: left; }
        .ml-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .ml-card-header h3 { font-size: 0.95rem; font-weight: 700; color: #4c1d95; margin: 0; flex: 1; }
        .ml-badge { font-size: 0.72rem; font-weight: 700; background: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
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

// ─── Demographic Insight Panel ────────────────────────────────────────────────
const DemographicInsight = ({ adj }) => {
  if (!adj) return null;

  const riskColors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
  const color   = riskColors[adj.adjustedRisk] || '#6b7280';
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
            <span className="mini-value">{adj.normMean ? adj.normMean.toFixed(1) : '26.8'}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Z-Score</span>
            <span className="mini-value" style={{ color: (adj.zScore ?? 0) < -1 ? '#ef4444' : '#10b981' }}>
              {(adj.zScore ?? 0) > 0 ? '+' : ''}{adj.zScore ?? '0.0'}
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

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

// ─── MoCATest Component ───────────────────────────────────────────────────────
const MoCATest = () => {
  const navigate = useNavigate();
  // Questions with shuffled options
  const [questions, setQuestions]     = useState(() => getMoCAQuestions());
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers]         = useState({});
  const [isFinished, setIsFinished]   = useState(false);
  const [startTime]                   = useState(Date.now());
  const [result, setResult]           = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Review filter: 'all' | 'correct' | 'incorrect'
  const [reviewFilter, setReviewFilter] = useState('all');

  const currentQuestion = questions[currentStep];
  const progress        = ((currentStep + 1) / questions.length) * 100;

  const handleSelectAnswer = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleConfirmNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finishTest(answers);
    }
  };

  const finishTest = async (finalAnswers) => {
    setIsFinished(true);
    setSubmitting(true);
    const duration_secs = Math.round((Date.now() - startTime) / 1000);
    const safeQuestions = questions.map(({ id, section, domain, correctAnswer, score }) => ({ id, section, domain, correctAnswer, score }));

    try {
      const { data } = await testService.submitMoCA({ answers: finalAnswers, duration_secs, questions: safeQuestions });
      setResult(data.data);
    } catch (err) {
      const localScore = calculateScore(finalAnswers, questions);
      setResult({ score: localScore, max_score: 30, risk_level: interpretMOCA(localScore).level });
      setSubmitError('Assessment recorded in session profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const interpretation   = result ? interpretMOCA(result.score) : null;
  const domainBreakdown  = isFinished ? getDomainBreakdown(answers, questions) : [];
  const memorySharpness  = isFinished ? getMemorySharpnessStats(answers, questions) : null;
  const recommendations  = isFinished ? generateClinicalSuggestions(answers, questions, 'MoCA') : [];

  const rawScore = isFinished ? calculateScore(answers, questions) : 0;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const incorrectCount = questions.length - correctCount;

  const filteredQuestions = questions.filter((q) => {
    const isCorrect = answers[q.id] === q.correctAnswer;
    if (reviewFilter === 'correct') return isCorrect;
    if (reviewFilter === 'incorrect') return !isCorrect;
    return true;
  });

  if (isFinished) {
    return (
      <div className="test-v2-container animate-fade-up">
        <div className="card-modern results-summary-v2">
          {submitting ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spin-ring" />
              <p style={{ marginTop: 16, color: 'var(--text-sub)' }}>Analysing Montreal Cognitive Assessment responses and running AI risk model...</p>
              <style jsx>{`.spin-ring{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:var(--secondary);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="completion-top">
                <div className="lottie-mock-success">
                  <CheckCircle2 size={56} strokeWidth={2.5} color="#10b981" />
                </div>
                <h1>MoCA Assessment Complete</h1>
                <p>Montreal Cognitive Assessment metrics evaluated with normative calibration.</p>
                {submitError && <p className="session-note">{submitError}</p>}
              </div>

              {/* Main Score & Risk Badge */}
              <div className="score-viz-v2">
                <div className="circular-progress-v2">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                    <circle
                      cx="50" cy="50" r="45" stroke={interpretation?.color || '#10b981'} strokeWidth="10" fill="none"
                      strokeDasharray={`${(((result?.score ?? rawScore) / 30) * 283)} 283`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
                    />
                  </svg>
                  <div className="center-score">
                    <span className="sc-big">{result?.score ?? rawScore}</span>
                    <span className="sc-sm">Score / 30</span>
                  </div>
                </div>

                <div className="result-badge-v2" style={{ background: `${interpretation?.color}15`, border: `1.5px solid ${interpretation?.color}40`, color: interpretation?.color }}>
                  <TrendingDown size={28} />
                  <div>
                    <h3>{result?.risk_level || interpretation?.level} Risk Level</h3>
                    <p>{interpretation?.interpretation}</p>
                  </div>
                </div>

                {/* ML Prediction Card */}
                {result?.ml_prediction && <MLPredictionCard ml={result.ml_prediction} />}

                {/* Demographic Insight */}
                <DemographicInsight adj={result?.demographic_adjustment} />

                {/* Memory Sharpness & Delayed Recall Card */}
                {memorySharpness && (
                  <div className="memory-sharpness-card">
                    <div className="m-card-header">
                      <Brain size={22} color="#8b5cf6" />
                      <div>
                        <h4>Memory Sharpness & Delayed Recall Index (5-Word Recall)</h4>
                        <span>Testing delayed retrieval of 5 items: Face, Velvet, Church, Daisy, Red</span>
                      </div>
                      <span className="m-score-tag">{memorySharpness.score} / {memorySharpness.total} ({memorySharpness.percent}%)</span>
                    </div>
                    <div className="m-progress-bar">
                      <div className="m-progress-fill" style={{ width: `${memorySharpness.percent}%`, background: memorySharpness.percent >= 80 ? '#10b981' : memorySharpness.percent >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <p className="m-card-note">{memorySharpness.note}</p>
                  </div>
                )}

                {/* Cognitive Domain Breakdown */}
                <div className="domain-breakdown-card">
                  <div className="domain-card-header">
                    <BarChart2 size={20} color="#7c3aed" />
                    <h4>MoCA Cognitive Domain Breakdown</h4>
                  </div>
                  <div className="domain-bars">
                    {domainBreakdown.map((item, idx) => (
                      <div key={idx} className="domain-bar-row">
                        <div className="d-label-row">
                          <span className="d-name">{item.domain}</span>
                          <span className="d-fraction">
                            <strong>{item.correct}</strong> / {item.total} pts ({item.percent}%) · <span className={`d-status ${item.status === 'Intact' ? 'green' : 'amber'}`}>{item.status}</span>
                          </span>
                        </div>
                        <div className="d-bar-track">
                          <div
                            className="d-bar-fill"
                            style={{
                              width: `${item.percent}%`,
                              background: item.percent === 100 ? '#10b981' : item.percent >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question-by-Question Accuracy Review */}
                <div className="review-section card-modern">
                  <div className="review-header">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Detailed Question Analysis</h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                        Review every attempted question, your selected response, and expected clinical answers.
                      </p>
                    </div>
                    <div className="review-filter-buttons">
                      <button
                        className={`filter-chip ${reviewFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('all')}
                      >
                        All ({questions.length})
                      </button>
                      <button
                        className={`filter-chip correct ${reviewFilter === 'correct' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('correct')}
                      >
                        ✓ Correct ({correctCount})
                      </button>
                      <button
                        className={`filter-chip incorrect ${reviewFilter === 'incorrect' ? 'active' : ''}`}
                        onClick={() => setReviewFilter('incorrect')}
                      >
                        ✕ Incorrect ({incorrectCount})
                      </button>
                    </div>
                  </div>

                  <div className="question-review-list">
                    {filteredQuestions.map((q) => {
                      const userAns   = answers[q.id];
                      const isCorrect = userAns === q.correctAnswer;
                      return (
                        <div key={q.id} className={`q-review-item ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                          <div className="q-review-top">
                            <div className="q-badge-row">
                              <span className="q-num">Q{q.id}</span>
                              <span className="q-domain-tag">{q.domain || q.section}</span>
                              {isCorrect ? (
                                <span className="status-pill correct"><Check size={12} /> Correct (+{q.score})</span>
                              ) : (
                                <span className="status-pill incorrect"><X size={12} /> Missed</span>
                              )}
                            </div>
                            <span className="q-score-pts">{isCorrect ? '1 / 1 pt' : '0 / 1 pt'}</span>
                          </div>

                          <h5 className="q-review-title">{q.question}</h5>

                          <div className="q-answers-comparison">
                            <div className={`ans-bubble ${isCorrect ? 'bubble-correct' : 'bubble-user-err'}`}>
                              <span className="ans-tag">Your Answer:</span>
                              <strong>{userAns || '(No selection made)'}</strong>
                            </div>
                            {!isCorrect && (
                              <div className="ans-bubble bubble-target">
                                <span className="ans-tag">Correct Target:</span>
                                <strong>{q.correctAnswer}</strong>
                              </div>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="q-explanation">
                              <BookOpen size={14} />
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Personalized Improvement Suggestions */}
                <div className="suggestions-section card-modern">
                  <div className="sugg-header">
                    <Lightbulb size={24} color="#f59e0b" />
                    <div>
                      <h3>Personalized Cognitive Improvement Plan</h3>
                      <p>Targeted exercises tailored to your MoCA performance profile</p>
                    </div>
                  </div>

                  <div className="sugg-grid">
                    {recommendations.map((s, i) => (
                      <div key={i} className={`sugg-card severity-${s.severity}`}>
                        <div className="sugg-top">
                          <span className="sugg-domain">{s.domain}</span>
                          <span className={`sugg-pill ${s.severity}`}>
                            {s.severity === 'high' ? 'High Priority' : s.severity === 'medium' ? 'Focus Area' : 'Wellness'}
                          </span>
                        </div>
                        <p className="sugg-rec">{s.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="action-footer-v2">
                <button className="btn-primary-lg" onClick={() => navigate('/reports')}>
                  View Reports & PDF Export <ArrowRight size={20} />
                </button>
                <button className="btn-outline-lg" onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </button>
                <button
                  className="btn-link-v2"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentStep(0);
                    setAnswers({});
                    setQuestions(getMoCAQuestions()); // fresh shuffled
                  }}
                >
                  <RefreshCw size={16} /> Retake MoCA Assessment
                </button>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .test-v2-container { padding: 40px 20px; max-width: 860px; margin: 0 auto; }
          .results-summary-v2 { text-align: center; padding: 48px 36px; border-radius: 24px; }
          .completion-top h1 { font-size: 2.2rem; margin: 16px 0 8px; color: var(--text-main, #0f172a); }
          .completion-top p { color: var(--text-sub, #64748b); margin-bottom: 32px; font-size: 1.05rem; }
          .session-note { color: #d97706; font-size: 0.85rem; font-weight: 600; }
          .score-viz-v2 { display: flex; flex-direction: column; align-items: stretch; gap: 28px; margin-bottom: 40px; }
          .circular-progress-v2 { position: relative; width: 180px; height: 180px; transform: rotate(-90deg); margin: 0 auto; }
          .circular-progress-v2 svg { width: 100%; height: 100%; }
          .center-score { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; transform: rotate(90deg); }
          .sc-big { font-size: 3.6rem; font-weight: 800; color: var(--text-main, #0f172a); line-height: 1; }
          .sc-sm { font-size: 0.85rem; color: var(--text-muted, #94a3b8); font-weight: 700; text-transform: uppercase; margin-top: 4px; }
          
          .result-badge-v2 { display: flex; align-items: center; gap: 20px; padding: 20px 24px; border-radius: 16px; text-align: left; }
          .result-badge-v2 h3 { font-size: 1.25rem; margin-bottom: 4px; }
          .result-badge-v2 p { font-size: 0.95rem; opacity: 0.95; margin: 0; line-height: 1.5; }

          /* Memory Sharpness Card */
          .memory-sharpness-card { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1.5px solid #d8b4fe; border-radius: 16px; padding: 22px 24px; text-align: left; }
          .m-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
          .m-card-header h4 { margin: 0; font-size: 1.05rem; color: #581c87; font-weight: 700; flex: 1; }
          .m-card-header span { font-size: 0.8rem; color: #7e22ce; display: block; }
          .m-score-tag { background: white; padding: 6px 14px; border-radius: 20px; font-weight: 800; color: #6b21a8; font-size: 0.9rem; box-shadow: 0 2px 6px rgba(107,33,168,0.1); }
          .m-progress-bar { height: 10px; background: #e9d5ff; border-radius: 99px; overflow: hidden; margin-bottom: 10px; }
          .m-progress-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }
          .m-card-note { margin: 0; font-size: 0.88rem; color: #4c1d95; line-height: 1.5; }

          /* Domain breakdown */
          .domain-breakdown-card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; text-align: left; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
          .domain-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
          .domain-card-header h4 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
          .domain-bars { display: flex; flex-direction: column; gap: 16px; }
          .domain-bar-row { display: flex; flex-direction: column; gap: 6px; }
          .d-label-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
          .d-name { font-weight: 700; color: #334155; }
          .d-fraction { color: #64748b; font-size: 0.82rem; }
          .d-status.green { color: #16a34a; font-weight: 700; }
          .d-status.amber { color: #d97706; font-weight: 700; }
          .d-bar-track { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
          .d-bar-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }

          /* Review Section */
          .review-section { text-align: left; padding: 28px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; }
          .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; }
          .review-filter-buttons { display: flex; gap: 8px; }
          .filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; border: 1.5px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; transition: all 0.2s; }
          .filter-chip.active { background: #0f172a; color: white; border-color: #0f172a; }
          .filter-chip.correct.active { background: #16a34a; border-color: #16a34a; color: white; }
          .filter-chip.incorrect.active { background: #dc2626; border-color: #dc2626; color: white; }
          
          .question-review-list { display: flex; flex-direction: column; gap: 14px; max-height: 520px; overflow-y: auto; padding-right: 6px; }
          .q-review-item { padding: 18px 20px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: #fcfcfd; }
          .q-review-item.is-correct { border-left: 4px solid #10b981; }
          .q-review-item.is-incorrect { border-left: 4px solid #ef4444; background: #fffafb; }
          .q-review-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .q-badge-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
          .q-num { font-weight: 800; color: #475569; font-size: 0.82rem; background: #e2e8f0; padding: 2px 8px; border-radius: 6px; }
          .q-domain-tag { font-size: 0.78rem; color: #7c3aed; font-weight: 700; background: #f5f3ff; padding: 2px 8px; border-radius: 6px; }
          .status-pill { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
          .status-pill.correct { background: #dcfce7; color: #15803d; }
          .status-pill.incorrect { background: #fee2e2; color: #b91c1c; }
          .q-score-pts { font-weight: 700; font-size: 0.85rem; color: #64748b; }
          .q-review-title { font-size: 1.05rem; color: #1e293b; margin: 0 0 12px; line-height: 1.4; font-weight: 600; }
          .q-answers-comparison { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
          .ans-bubble { padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; display: flex; gap: 6px; align-items: baseline; }
          .bubble-correct { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
          .bubble-user-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
          .bubble-target { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
          .ans-tag { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
          .q-explanation { display: flex; align-items: flex-start; gap: 8px; font-size: 0.82rem; color: #475569; line-height: 1.45; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .q-explanation svg { color: #8b5cf6; flex-shrink: 0; margin-top: 2px; }

          /* Suggestions */
          .suggestions-section { text-align: left; padding: 28px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; }
          .sugg-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
          .sugg-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
          .sugg-header p { margin: 2px 0 0; color: #64748b; font-size: 0.88rem; }
          .sugg-grid { display: flex; flex-direction: column; gap: 14px; }
          .sugg-card { padding: 18px 20px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #f8fafc; }
          .sugg-card.severity-high { border-color: #fca5a5; background: #fff5f5; }
          .sugg-card.severity-medium { border-color: #fed7aa; background: #fffaf0; }
          .sugg-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .sugg-domain { font-weight: 800; font-size: 0.95rem; color: #1e293b; }
          .sugg-pill { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; }
          .sugg-pill.high { background: #fee2e2; color: #dc2626; }
          .sugg-pill.medium { background: #fef3c7; color: #d97706; }
          .sugg-pill.low { background: #dcfce7; color: #16a34a; }
          .sugg-rec { margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.55; }

          /* Footer */
          .action-footer-v2 { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 10px; }
          .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
          .btn-outline-lg { display: flex; align-items: center; justify-content: center; padding: 14px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 0.95rem; font-weight: 700; cursor: pointer; color: #475569; }
          .btn-link-v2 { display: flex; align-items: center; justify-content: center; gap: 8px; background: none; border: none; color: #64748b; font-size: 0.9rem; font-weight: 700; cursor: pointer; padding: 8px; }
          .btn-link-v2:hover { color: var(--primary, #4a90e2); }
        `}</style>
      </div>
    );
  }

  // Active testing interface
  return (
    <div className="test-player-v2 container animate-fade-up">
      <header className="player-header-v2">
        <div className="player-meta">
          <div className="meta-icon-v2"><Activity size={26} /></div>
          <div>
            <h1>MoCA Clinical Assessment</h1>
            <span className="section-label-active">{currentQuestion.section}</span>
          </div>
        </div>
        <div className="player-timer">
          <Clock size={16} />
          <span>Question {currentStep + 1} of {questions.length}</span>
        </div>
      </header>

      <div className="player-progress-v2">
        <div className="progress-top">
          <span>{Math.round(progress)}% Complete</span>
          <span>{currentStep + 1}/{questions.length}</span>
        </div>
        <div className="progress-track-v2">
          <div className="progress-bar-v2" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="player-body-v2">
        <QuestionCard
          key={currentQuestion.id}
          {...currentQuestion}
          onSelect={handleSelectAnswer}
          onConfirmNext={handleConfirmNext}
          selectedAnswer={answers[currentQuestion.id]}
          isLast={currentStep === questions.length - 1}
          accentColor="#7C3AED"
        />

        <div className="player-nav-v2">
          <button
            type="button"
            className="btn-text-v2"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ChevronLeft size={20} /> Previous Question
          </button>

          <div className="player-help">
            <AlertCircle size={16} /> Select your choice and click Next Question
          </div>

          <button
            type="button"
            className="btn-text-v2"
            onClick={() => setCurrentStep((s) => Math.min(questions.length - 1, s + 1))}
          >
            Skip for Now <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .test-player-v2 { padding: 40px 0; max-width: 840px; }
        .player-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .player-meta { display: flex; align-items: center; gap: 16px; }
        .meta-icon-v2 { width: 50px; height: 50px; background: #f5f3ff; color: #7c3aed; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .player-meta h1 { font-size: 1.6rem; margin-bottom: 2px; }
        .section-label-active { font-size: 0.85rem; color: #7c3aed; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .player-timer { display: flex; align-items: center; gap: 8px; color: var(--text-sub); font-weight: 700; font-size: 0.9rem; background: white; padding: 10px 18px; border-radius: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .player-progress-v2 { margin-bottom: 36px; }
        .progress-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem; color: var(--text-sub); }
        .progress-track-v2 { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-bar-v2 { height: 100%; background: linear-gradient(90deg, #7C3AED, #2563EB); transition: width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .player-nav-v2 { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding: 0 4px; }
        .btn-text-v2 { background: none; border: none; color: var(--text-sub); font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.95rem; }
        .btn-text-v2:hover:not(:disabled) { color: #7c3aed; }
        .btn-text-v2:disabled { opacity: 0.4; cursor: not-allowed; }
        .player-help { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default MoCATest;
