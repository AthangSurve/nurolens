import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Clock, Brain, Mic, Upload, FileText, ArrowRight,
  Activity, AlertCircle, ChevronRight, CheckCircle2, Cpu,
  Compass, GitCommit, Video, UserCheck, Stethoscope, Sparkles, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import { escapeHtml, printDocument } from '../utils/printDocument';

const generatePrescriptionPDF = (prescription, user) => {
  const content = `
    <h1>MRI Prescription</h1>
    <div class="muted">NeuroLens · Prescribed ${escapeHtml(new Date(prescription.prescribed_at).toLocaleString())}</div>
    <div class="section">
      <strong>Patient:</strong> ${escapeHtml(user?.full_name || 'Patient')}<br>
      <strong>Patient ID:</strong> ${escapeHtml(user?.patient_id || 'N/A')}<br>
      <strong>Prescribing doctor:</strong> ${escapeHtml(prescription.doctor_name || 'Your doctor')}
    </div>
    <div class="section">
      <h2>Instructions</h2>
      <p class="notes">${escapeHtml(prescription.notes || 'Please arrange the MRI scan and upload the scan file to NeuroLens for analysis.')}</p>
    </div>
    <div class="muted">Bring this prescription to your imaging provider. Upload the resulting scan through the MRI Upload page.</div>`;
  printDocument('NeuroLens MRI Prescription', content);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    dashboardService.getData()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const assessmentCards = [
    { title: 'Clinical MMSE',        desc: 'Global screening tool for orientation & recall.',       icon: <Brain size={24} />,     color: 'blue',   path: '/tests/mmse' },
    { title: 'Clinical MoCA',        desc: 'Detailed screening for cognitive impairment.',          icon: <Activity size={24} />,  color: 'purple', path: '/tests/moca' },
    { title: 'Clock Drawing Test',   desc: 'Visuospatial & executive automated clock analysis.',    icon: <Compass size={24} />,   color: 'cyan',   path: '/tests/clock' },
    { title: 'Trail Making Test',    desc: 'Processing speed, visual search & mental flexibility.',  icon: <GitCommit size={24} />, color: 'indigo', path: '/tests/trail' },
    { title: 'Speech Biomarkers',    desc: 'Acoustic clarity, pause ratio & vocal stability.',      icon: <Mic size={24} />,       color: 'orange', path: '/speech-test' },
    { title: 'Structural MRI Scan',  desc: 'Coronal T1 analysis & hippocampal volumetry.',          icon: <Upload size={24} />,    color: 'green',  path: '/mri-upload' },
  ];

  const firstName = user?.full_name?.split(' ')[0] || 'Patient';

  if (loading) return (
    <div className="dash-loading">
      <div className="spin-ring" />
      <span>Loading your clinical health dashboard...</span>
      <style>{`.dash-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:var(--primary);font-weight:600}.spin-ring{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const recentActivity = data?.recent_activity || [];
  const latestScores = data?.latest_scores || {};
  const mmse  = latestScores?.MMSE;
  const moca  = latestScores?.MoCA;
  const clock = latestScores?.Clock;
  const trail = latestScores?.Trail;
  const doctorNotes = data?.doctor_notes || [];
  const latestDoctorNote = doctorNotes[0];
  const trendData = data?.trend_data || [];
  const mriPrescriptions = data?.mri_prescriptions || [];

  return (
    <div className="dashboard-v2 animate-fade-up">
      <div className="container dashboard-grid">
        {/* Main Content Area */}
        <div className="main-panel">
          {error && (
            <div className="alert-block alert-danger mb-4">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {/* Welcome Card */}
          <section className="welcome-banner">
            <div className="welcome-text">
              <span className="date-tag">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <h1>Welcome back, <span className="text-primary">{firstName}</span></h1>
              <p>
                {data?.overall_risk
                  ? `Your composite cognitive risk is currently categorized as ${data.overall_risk}. Regular longitudinal tracking helps safeguard neurological vitality.`
                  : 'Take your baseline assessments to start tracking your cognitive and structural brain health.'}
              </p>
              <div className="welcome-stats">
                <div className="mini-stat">
                  <TrendingUp size={16} className="text-secondary" />
                  <span><strong>{data?.tests_completed || 0}</strong> Assessments Completed</span>
                </div>
                <div
                  className={`mini-stat ${data?.upcoming_consultation ? 'clickable' : ''}`}
                  onClick={() => data?.upcoming_consultation && navigate('/consult-doctor?tab=consultations')}
                  title={data?.upcoming_consultation ? 'Click to view or join your teleconsultation' : undefined}
                  style={data?.upcoming_consultation ? { cursor: 'pointer', color: 'var(--primary)' } : {}}
                >
                  <Video size={16} className="text-primary" />
                  <span>
                    {data?.upcoming_consultation
                      ? `Consultation: ${new Date(data.upcoming_consultation.scheduled_at).toLocaleDateString()} (Join Room →)`
                      : 'No upcoming teleconsultation'}
                  </span>
                </div>
              </div>
            </div>
            <div className="welcome-illustration">
              <div className="pulse-aura"></div>
              <Brain size={110} className="text-primary opacity-20" />
            </div>
          </section>

          {/* Doctor Clinical Improvement Recommendations Banner (Req 14 & 15) */}
          {latestDoctorNote && (
            <section className="doctor-rec-banner">
              <div className="dr-rec-header">
                <div className="dr-rec-title">
                  <Stethoscope size={20} className="text-primary" />
                  <h3>Attending Doctor's Clinical Recommendations</h3>
                </div>
                <span className="dr-rec-date">{new Date(latestDoctorNote.created_at).toLocaleDateString()}</span>
              </div>
              <p className="dr-rec-text">"{latestDoctorNote.note}"</p>
              {latestDoctorNote.improvements && (
                <div className="dr-rec-points">
                  <strong>Prescribed Action Items & Cognitive Exercises:</strong>
                  <p>{latestDoctorNote.improvements}</p>
                </div>
              )}
              <div className="dr-rec-action">
                <button className="btn-sm-primary" onClick={() => navigate('/consult-doctor?tab=consultations')}>
                  <Video size={14} /> Open Doctor Meeting & Teleconsultation Room
                </button>
              </div>
            </section>
          )}

          {/* Assessment Grid — 6 Tests (Req 14) */}
          <section className="assessments-section">
            <div className="section-header-compact">
              <div>
                <h2>Comprehensive Diagnostic Suite</h2>
                <span className="sub-caption">Standardized clinical assessments, computer-vision drawing tests & neuroimaging</span>
              </div>
              <button className="btn-link" onClick={() => navigate('/tests')}>All Tests <ChevronRight size={16} /></button>
            </div>
            <div className="assessment-grid-modern">
              {assessmentCards.map((card, i) => (
                <div key={i} className="card-modern assessment-card" onClick={() => navigate(card.path)}>
                  <div className={`icon-square bg-${card.color}`}>{card.icon}</div>
                  <div className="card-info">
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                  </div>
                  <button className="icon-btn-round"><ArrowRight size={18} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Trend Bars */}
          <section className="trends-section">
            <div className="card-modern trends-card">
              <div className="card-header-with-icon">
                <TrendingUp size={22} className="text-primary" />
                <h3>Longitudinal Stability Trajectory</h3>
              </div>
              <div className="mock-graph">
                {trendData.length > 0 ? (
                  <div className="graph-bars">
                    {trendData.map((d, i) => (
                    <div key={i} className="bar-col">
                      <div className="bar-fill" style={{ height: `${Math.min(100, Math.max(0, d.percent || 0))}%`, animationDelay: `${i * 0.1}s` }}></div>
                      <span className="bar-label" title={`${d.label}: ${d.score}/${d.max}`}>
                        {d.label}<br />{new Date(d.date).toLocaleDateString()}
                      </span>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="graph-empty">Complete an assessment to see your session history here.</div>
                )}
              </div>
            </div>
          </section>

          <section className="mri-prescriptions-section">
            <div className="section-header-compact">
              <div>
                <h2>MRI Prescriptions from Your Doctor</h2>
                <span className="sub-caption">Prescriptions and scan-review status</span>
              </div>
            </div>
            {mriPrescriptions.length === 0 ? (
              <div className="card-modern prescription-empty">
                No MRI prescriptions yet. Any prescription from your doctor will appear here.
              </div>
            ) : (
              <div className="prescription-list">
                {mriPrescriptions.map((prescription) => {
                  const scan = prescription.scan;
                  const reviewLabel = scan?.review_status === 'approved'
                    ? 'Doctor approved'
                    : scan?.review_status === 'needs_follow_up'
                    ? 'Follow-up needed'
                    : scan
                    ? 'Awaiting doctor review'
                    : 'MRI not uploaded yet';
                  return (
                    <div className="card-modern prescription-card" key={prescription.id}>
                      <div className="prescription-info">
                        <strong>{prescription.doctor_name} · {new Date(prescription.prescribed_at).toLocaleDateString()}</strong>
                        <span>{reviewLabel}</span>
                        {prescription.notes && <p>{prescription.notes}</p>}
                        {scan?.review_notes && <p className="review-note">Doctor's review: {scan.review_notes}</p>}
                      </div>
                      <div className="prescription-actions">
                        <button className="prescription-pdf-btn" onClick={() => generatePrescriptionPDF(prescription, user)}>
                          <Download size={15} /> Prescription PDF
                        </button>
                        {(!scan || scan.review_status === 'needs_follow_up') && prescription.status === 'pending' && (
                          <button className="prescription-upload-btn" onClick={() => navigate('/mri-upload')}>
                            <Upload size={15} /> Upload MRI
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Panel */}
        <aside className="side-panel">
          {/* Risk Level */}
          <div className="card-modern risk-summary-card">
            <h3>Cognitive Risk Index</h3>
            <div className="risk-gauge">
              <div className={`gauge-fill risk-${(data?.overall_risk || 'Low').toLowerCase()}`}></div>
              <div className="gauge-label">
                <span className="risk-title">{data?.overall_risk ? `${data.overall_risk} Risk` : 'Baseline'}</span>
                <span className="risk-percent">{data?.overall_risk_percent ?? 12}%</span>
              </div>
            </div>
            <div className={`alert-badge ${!data?.overall_risk || data.overall_risk === 'Low' ? 'success' : 'warning'}`}>
              <CheckCircle2 size={16} />
              <span>{data?.overall_risk === 'High' ? 'Elevated cognitive risk detected' : 'Optimal cognitive baseline verified'}</span>
            </div>
            
            <div className="scores-quick-strip">
              <div className="strip-item">
                <span>MMSE</span>
                <strong>{mmse ? `${mmse.score}/${mmse.max_score}` : '--'}</strong>
              </div>
              <div className="strip-item">
                <span>MoCA</span>
                <strong>{moca ? `${moca.score}/${moca.max_score}` : '--'}</strong>
              </div>
              <div className="strip-item">
                <span>Clock</span>
                <strong>{clock ? `${clock.score}/${clock.max_score}` : '--'}</strong>
              </div>
              <div className="strip-item">
                <span>Trail</span>
                <strong>{trail ? `${trail.score}/${trail.max_score}` : '--'}</strong>
              </div>
            </div>
          </div>

          {/* AI Risk Panel — shown if MoCA data exists */}
          {moca && (
            <div className="card-modern ai-risk-card">
              <div className="ai-risk-header">
                <Cpu size={18} color="#8b5cf6" />
                <h3>AI Demographic Risk Adjustment</h3>
              </div>
              <div className="ai-risk-body">
                <div className="ai-risk-score-row">
                  <span className="ai-risk-label">Raw MoCA Score</span>
                  <span className="ai-risk-val">{moca.score}<small>/{moca.max_score}</small></span>
                </div>
                {moca.norm_percentile != null && (
                  <div className="ai-risk-score-row">
                    <span className="ai-risk-label">Demographic Percentile</span>
                    <span className="ai-risk-val" style={{ color: moca.norm_percentile < 16 ? '#ef4444' : '#10b981' }}>
                      {moca.norm_percentile}<small>th</small>
                    </span>
                  </div>
                )}
                <div className="ai-norm-bar-track">
                  <div className="ai-norm-bar-fill" style={{
                    width: `${moca.norm_percentile ?? 50}%`,
                    background: moca.norm_percentile < 16 ? '#ef4444' : moca.norm_percentile < 30 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
                <div className="ai-risk-badge" style={{
                  background: moca.adjusted_risk === 'High' ? '#fef2f2' : moca.adjusted_risk === 'Moderate' ? '#fffbeb' : '#f0fdf4',
                  color:      moca.adjusted_risk === 'High' ? '#ef4444' : moca.adjusted_risk === 'Moderate' ? '#d97706' : '#10b981',
                }}>
                  {moca.adjusted_risk || moca.risk_level} Risk Classification
                </div>
              </div>
              <button className="btn-full-outline" onClick={() => navigate('/reports')} style={{ marginTop: 12 }}>View Clinical Reports</button>
            </div>
          )}

          {/* Recent Results */}
          <div className="card-modern shadow-soft-sm">
            <div className="header-flex">
              <h3>Recent Assessment Activity</h3>
              <FileText size={18} className="text-muted" />
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No assessments completed yet. Take your first test!</p>
              ) : recentActivity.map((act, i) => (
                <div key={i} className="activity-item">
                  <div className="act-info">
                    <strong>{act.type}</strong>
                    <span>{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                  <div className="act-score">
                    <span className="score-v">{act.score}</span>
                    <span className="status-v">{act.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-full-outline mt-4" onClick={() => navigate('/reports')}>View Detailed Clinical Reports</button>
          </div>

          {/* NeuroLens Tip */}
          <div className="recommendation-card">
            <Sparkles size={24} className="text-white" />
            <div className="rec-text">
              <h4>Neuroplasticity Protocol</h4>
              <p>Dual-task cognitive motor drills and Trail Making practice stimulate dorsolateral prefrontal connectivity.</p>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .dashboard-v2 { padding: 40px 0; }
        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
        .welcome-banner { background: linear-gradient(135deg, #E8F2FF 0%, #FFFFFF 100%); border: 1px solid var(--surface-alt); border-radius: var(--radius-lg); padding: 36px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; position: relative; overflow: hidden; }
        .date-tag { color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 10px; display: block; }
        .welcome-text h1 { font-size: 2.3rem; margin-bottom: 10px; }
        .welcome-text p { color: var(--text-sub); max-width: 480px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5; }
        .welcome-stats { display: flex; gap: 24px; flex-wrap: wrap; }
        .mini-stat { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-main); }
        .pulse-aura { position: absolute; right: -50px; width: 300px; height: 300px; background: var(--primary); filter: blur(100px); opacity: 0.1; }
        
        /* Doctor recommendation banner */
        .doctor-rec-banner { background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1px solid #bfdbfe; border-left: 5px solid var(--primary); border-radius: 16px; padding: 22px 26px; margin-bottom: 28px; }
        .dr-rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .dr-rec-title { display: flex; align-items: center; gap: 8px; }
        .dr-rec-title h3 { font-size: 1.05rem; color: #1e3a8a; margin: 0; font-weight: 700; }
        .dr-rec-date { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .dr-rec-text { font-size: 0.92rem; color: #1e293b; font-style: italic; margin-bottom: 12px; line-height: 1.5; }
        .dr-rec-points { background: white; border-radius: 10px; padding: 12px 16px; border: 1px solid #dbeafe; margin-bottom: 14px; font-size: 0.88rem; }
        .dr-rec-points strong { color: #1e40af; display: block; margin-bottom: 4px; font-size: 0.8rem; text-transform: uppercase; }
        .dr-rec-points p { margin: 0; color: #334155; line-height: 1.5; }
        .dr-rec-action { display: flex; justify-content: flex-end; }
        .btn-sm-primary { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: var(--transition); }
        .btn-sm-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .section-header-compact { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
        .section-header-compact h2 { margin: 0; font-size: 1.35rem; }
        .sub-caption { font-size: 0.82rem; color: var(--text-muted); display: block; margin-top: 2px; }
        .btn-link { background: none; border: none; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; }
        
        .assessment-grid-modern { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
        .assessment-card { display: flex; align-items: center; gap: 16px; cursor: pointer; position: relative; padding: 20px; transition: var(--transition); }
        .assessment-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--primary); }
        .icon-square { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .bg-blue { background: var(--grad-primary); }
        .bg-purple { background: var(--grad-accent); }
        .bg-cyan { background: linear-gradient(135deg, #0284c7, #06b6d4); }
        .bg-indigo { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .bg-orange { background: linear-gradient(135deg, #F59E0B, #EF4444); }
        .bg-green { background: linear-gradient(135deg, #10B981, #059669); }
        .card-info { flex: 1; }
        .card-info h3 { font-size: 1.05rem; margin-bottom: 4px; }
        .card-info p { font-size: 0.82rem; color: var(--text-sub); line-height: 1.4; margin: 0; }
        .icon-btn-round { position: absolute; right: 16px; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--surface-alt); background: white; color: var(--primary); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateX(10px); transition: var(--transition); }
        .assessment-card:hover .icon-btn-round { opacity: 1; transform: translateX(0); }

        .trends-card { padding: 24px; }
        .card-header-with-icon { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .card-header-with-icon h3 { margin: 0; font-size: 1.15rem; }
        .mock-graph { height: 160px; margin-top: 20px; display: flex; align-items: flex-end; }
        .graph-empty { width: 100%; padding: 48px 12px; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
        .graph-bars { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .bar-fill { width: 45%; background: var(--grad-primary); border-radius: 6px 6px 0 0; animation: growBar 1s ease-out forwards; }
        .bar-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
        @keyframes growBar { from { height: 0; } }

        .side-panel { display: flex; flex-direction: column; gap: 20px; }
        .risk-summary-card { text-align: center; padding: 24px; }
        .risk-gauge { height: 110px; margin: 18px 0; position: relative; display: flex; align-items: center; justify-content: center; }
        .gauge-fill { width: 130px; height: 130px; border-radius: 50%; border: 12px solid var(--surface-alt); border-top-color: var(--secondary); transform: rotate(-45deg); }
        .gauge-fill.risk-moderate { border-top-color: #f59e0b; }
        .gauge-fill.risk-high { border-top-color: #ef4444; }
        .gauge-label { position: absolute; display: flex; flex-direction: column; }
        .risk-title { font-size: 0.82rem; color: var(--text-sub); font-weight: 600; }
        .risk-percent { font-size: 1.8rem; font-weight: 800; color: var(--secondary); }
        .alert-badge { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 0.82rem; font-weight: 600; justify-content: center; }
        .alert-badge.success { background: var(--surface-green); color: var(--secondary); }
        .alert-badge.warning { background: #fff7ed; color: #d97706; }

        .scores-quick-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--surface-alt); }
        .strip-item { display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 8px 4px; border-radius: 8px; }
        .strip-item span { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        .strip-item strong { font-size: 0.95rem; color: var(--text-main); }

        .ai-risk-card { padding: 20px; }
        .ai-risk-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .ai-risk-header h3 { margin: 0; font-size: 0.92rem; color: #4c1d95; }
        .ai-risk-body { display: flex; flex-direction: column; gap: 10px; }
        .ai-risk-score-row { display: flex; justify-content: space-between; align-items: baseline; }
        .ai-risk-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
        .ai-risk-val { font-size: 1.3rem; font-weight: 800; color: var(--text-main); }
        .ai-risk-val small { font-size: 0.75rem; color: var(--text-muted); }
        .ai-norm-bar-track { height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
        .ai-norm-bar-fill { height: 100%; border-radius: 99px; transition: width 1.2s ease; }
        .ai-risk-badge { text-align: center; padding: 8px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; }

        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .header-flex h3 { margin: 0; font-size: 1rem; }
        .activity-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--surface-alt); }
        .activity-item:last-child { border-bottom: none; }
        .act-info { display: flex; flex-direction: column; }
        .act-info strong { font-size: 0.9rem; }
        .act-info span { font-size: 0.75rem; color: var(--text-muted); }
        .act-score { text-align: right; display: flex; flex-direction: column; }
        .score-v { font-weight: 700; color: var(--primary); font-size: 0.9rem; }
        .status-v { font-size: 0.72rem; color: var(--secondary); font-weight: 700; text-transform: uppercase; }

        .recommendation-card { background: var(--grad-accent); padding: 20px; border-radius: var(--radius-lg); color: white; display: flex; gap: 14px; align-items: flex-start; }
        .mri-prescriptions-section { margin: 24px 0; }
        .prescription-empty, .prescription-card { padding: 18px; }
        .prescription-list { display: flex; flex-direction: column; gap: 12px; }
        .prescription-card { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .prescription-info { display: flex; flex-direction: column; gap: 5px; }
        .prescription-info span, .prescription-info p { color: var(--text-sub); font-size: 0.86rem; margin: 0; }
        .prescription-info .review-note { color: #92400e; }
        .prescription-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .prescription-pdf-btn, .prescription-upload-btn { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 9px; padding: 9px 12px; color: white; background: var(--primary); font-weight: 700; cursor: pointer; white-space: nowrap; }
        .prescription-upload-btn { background: var(--secondary); }
        .rec-text h4 { margin: 0 0 4px 0; font-size: 0.95rem; }
        .rec-text p { font-size: 0.84rem; opacity: 0.95; margin: 0; line-height: 1.45; }
        .btn-full-outline { width: 100%; padding: 11px; border: 1px solid var(--surface-alt); background: white; border-radius: 10px; font-weight: 700; color: var(--text-main); cursor: pointer; transition: var(--transition); }
        .btn-full-outline:hover { background: #f8fafc; border-color: var(--primary); color: var(--primary); }

        @media (max-width: 992px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .welcome-banner { flex-direction: column; text-align: center; }
          .welcome-illustration { display: none; }
          .assessment-grid-modern { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
