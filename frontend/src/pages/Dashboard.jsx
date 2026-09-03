import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, Brain, Mic, Upload, FileText, ArrowRight, Activity, AlertCircle, ChevronRight, CheckCircle2, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';

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
    { title: 'Clinical MMSE', desc: 'Global screening tool for orientation.', icon: <Brain size={24} />, color: 'blue',   path: '/tests/mmse' },
    { title: 'Clinical MoCA', desc: 'Detailed screening for impairment.',    icon: <Activity size={24} />, color: 'purple', path: '/tests/moca' },
    { title: 'Speech Test',   desc: 'Analyzing vocal biomarkers.',           icon: <Mic size={24} />,    color: 'orange', path: '/speech-test' },
    { title: 'MRI Analysis',  desc: 'Structural brain health scan.',         icon: <Upload size={24} />, color: 'green',  path: '/mri-upload' },
  ];

  const firstName = user?.full_name?.split(' ')[0] || 'Patient';

  if (loading) return (
    <div className="dash-loading">
      <div className="spin-ring" />
      <span>Loading your health dashboard...</span>
      <style jsx>{`.dash-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:var(--primary);font-weight:600}.spin-ring{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const recentActivity = data?.recent_activity || [];
  const mmse  = data?.latest_scores?.MMSE;
  const moca  = data?.latest_scores?.MoCA;
  const trendData = data?.trend_data || [];

  return (
    <div className="dashboard-v2 animate-fade-up">
      <div className="container dashboard-grid">
        {/* Main Content Area */}
        <div className="main-panel">
          {/* Welcome Card */}
          <section className="welcome-banner">
            <div className="welcome-text">
              <span className="date-tag">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <h1>Welcome back, <span className="text-primary">{firstName}</span></h1>
              <p>
                {data?.overall_risk
                  ? `Your overall cognitive risk is ${data.overall_risk}. Keep up with your assessments.`
                  : 'Take your first assessment to start tracking your cognitive health.'}
              </p>
              <div className="welcome-stats">
                <div className="mini-stat">
                  <TrendingUp size={16} className="text-secondary" />
                  <span><strong>{data?.tests_completed || 0}</strong> Tests Completed</span>
                </div>
                <div
                  className={`mini-stat ${data?.upcoming_consultation ? 'clickable' : ''}`}
                  onClick={() => data?.upcoming_consultation && navigate('/consult-doctor?tab=consultations')}
                  title={data?.upcoming_consultation ? 'Click to view or join your teleconsultation' : undefined}
                  style={data?.upcoming_consultation ? { cursor: 'pointer' } : {}}
                >
                  <Clock size={16} className="text-primary" />
                  <span>
                    {data?.upcoming_consultation
                      ? `Consult: ${new Date(data.upcoming_consultation.scheduled_at).toLocaleDateString()} (Join →)`
                      : 'No upcoming consultations'}
                  </span>
                </div>
              </div>
            </div>
            <div className="welcome-illustration">
              <div className="pulse-aura"></div>
              <Brain size={100} className="text-primary opacity-20" />
            </div>
          </section>

          {/* Assessment Grid */}
          <section className="assessments-section">
            <div className="section-header-compact">
              <h2>Diagnostic Suite</h2>
              <button className="btn-link" onClick={() => navigate('/tests')}>All Assessments <ChevronRight size={16} /></button>
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
                <TrendingUp size={24} className="text-primary" />
                <h3>Cognitive Stability Trend</h3>
              </div>
              <div className="mock-graph">
                <div className="graph-bars">
                  {(trendData.length > 0 ? trendData : [40,60,55,75,80,78,85].map((v,i) => ({ percent: v, label: `M${i+1}` }))).map((d, i) => (
                    <div key={i} className="bar-col">
                      <div className="bar-fill" style={{ height: `${d.percent || d}%`, animationDelay: `${i * 0.1}s` }}></div>
                      <span className="bar-label">{d.label || `M${i+1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Panel */}
        <aside className="side-panel">
          {/* Risk Level */}
          <div className="card-modern risk-summary-card">
            <h3>Risk Assessment</h3>
            <div className="risk-gauge">
              <div className="gauge-fill"></div>
              <div className="gauge-label">
                <span className="risk-title">{data?.overall_risk ? `${data.overall_risk} Risk` : 'No Data Yet'}</span>
                <span className="risk-percent">{data?.overall_risk_percent ?? '--'}%</span>
              </div>
            </div>
            <div className={`alert-badge ${!data?.overall_risk || data.overall_risk === 'Low' ? 'success' : 'warning'}`}>
              <CheckCircle2 size={16} />
              <span>{data?.overall_risk === 'High' ? 'Elevated cognitive risk detected' : 'Optimal cognitive baseline'}</span>
            </div>
            {mmse && <p className="description-text">Latest MMSE: <strong>{mmse.score}/{mmse.max_score}</strong> · MoCA: <strong>{moca?.score ?? '--'}/{moca?.max_score ?? 30}</strong></p>}
          </div>

          {/* AI Risk Panel — shown if MoCA data exists */}
          {moca && (
            <div className="card-modern ai-risk-card">
              <div className="ai-risk-header">
                <Cpu size={18} color="#8b5cf6" />
                <h3>AI Risk Assessment</h3>
              </div>
              <div className="ai-risk-body">
                <div className="ai-risk-score-row">
                  <span className="ai-risk-label">MoCA Score</span>
                  <span className="ai-risk-val">{moca.score}<small>/{moca.max_score}</small></span>
                </div>
                {moca.norm_percentile != null && (
                  <div className="ai-risk-score-row">
                    <span className="ai-risk-label">Your Percentile</span>
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
                  {moca.adjusted_risk || moca.risk_level} Risk (Adjusted)
                </div>
              </div>
              <button className="btn-full-outline" onClick={() => navigate('/reports')} style={{ marginTop: 12 }}>View Full Report</button>
              <style>{`
                .ai-risk-card { padding: 20px; }
                .ai-risk-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
                .ai-risk-header h3 { margin: 0; font-size: 0.95rem; color: #4c1d95; }
                .ai-risk-body { display: flex; flex-direction: column; gap: 10px; }
                .ai-risk-score-row { display: flex; justify-content: space-between; align-items: baseline; }
                .ai-risk-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                .ai-risk-val { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
                .ai-risk-val small { font-size: 0.75rem; color: var(--text-muted); }
                .ai-norm-bar-track { height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
                .ai-norm-bar-fill { height: 100%; border-radius: 99px; transition: width 1.2s ease; }
                .ai-risk-badge { text-align: center; padding: 8px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; }
              `}</style>
            </div>
          )}


          <div className="card-modern shadow-soft-sm">
            <div className="header-flex">
              <h3>Recent Results</h3>
              <FileText size={18} className="text-muted" />
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No assessments yet. Take your first test!</p>
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
            <button className="btn-full-outline mt-4" onClick={() => navigate('/reports')}>View All Reports</button>
          </div>

          {/* Tip */}
          <div className="recommendation-card">
            <AlertCircle size={24} className="text-white" />
            <div className="rec-text">
              <h4>Pro Tip</h4>
              <p>Daily linguistic exercises can improve MMSE recall by 5.4%.</p>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .dashboard-v2 { padding: 40px 0; }
        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
        .welcome-banner { background: linear-gradient(135deg, #E8F2FF 0%, #FFFFFF 100%); border: 1px solid var(--surface-alt); border-radius: var(--radius-lg); padding: 40px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; position: relative; overflow: hidden; }
        .date-tag { color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 12px; display: block; }
        .welcome-text h1 { font-size: 2.5rem; margin-bottom: 12px; }
        .welcome-text p { color: var(--text-sub); max-width: 480px; margin-bottom: 24px; }
        .welcome-stats { display: flex; gap: 24px; }
        .mini-stat { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-main); }
        .pulse-aura { position: absolute; right: -50px; width: 300px; height: 300px; background: var(--primary); filter: blur(100px); opacity: 0.1; }
        .section-header-compact { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-link { background: none; border: none; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; }
        .assessment-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
        .assessment-card { display: flex; align-items: center; gap: 20px; cursor: pointer; position: relative; }
        .icon-square { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .bg-blue { background: var(--grad-primary); } .bg-purple { background: var(--grad-accent); } .bg-orange { background: linear-gradient(135deg, #F59E0B, #EF4444); } .bg-green { background: linear-gradient(135deg, #10B981, #059669); }
        .card-info h3 { font-size: 1.1rem; margin-bottom: 4px; }
        .card-info p { font-size: 0.85rem; color: var(--text-sub); }
        .icon-btn-round { position: absolute; right: 20px; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--surface-alt); background: white; color: var(--primary); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateX(10px); transition: var(--transition); }
        .assessment-card:hover .icon-btn-round { opacity: 1; transform: translateX(0); }
        .mock-graph { height: 180px; margin-top: 30px; display: flex; align-items: flex-end; }
        .graph-bars { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .bar-fill { width: 60%; background: var(--grad-primary); border-radius: 8px 8px 0 0; animation: growBar 1s ease-out forwards; }
        .bar-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        @keyframes growBar { from { height: 0; } }
        .side-panel { display: flex; flex-direction: column; gap: 24px; }
        .risk-summary-card { text-align: center; }
        .risk-gauge { height: 120px; margin: 24px 0; position: relative; display: flex; align-items: center; justify-content: center; }
        .gauge-fill { width: 140px; height: 140px; border-radius: 50%; border: 12px solid var(--surface-alt); border-top-color: var(--secondary); transform: rotate(-45deg); }
        .gauge-label { position: absolute; display: flex; flex-direction: column; }
        .risk-title { font-size: 0.85rem; color: var(--text-sub); font-weight: 600; }
        .risk-percent { font-size: 2rem; font-weight: 800; color: var(--secondary); }
        .alert-badge { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; justify-content: center; }
        .alert-badge.success { background: var(--surface-green); color: var(--secondary); }
        .alert-badge.warning { background: #fff7ed; color: #d97706; }
        .description-text { font-size: 0.85rem; color: var(--text-sub); margin-top: 16px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .activity-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--surface-alt); }
        .activity-item:last-child { border-bottom: none; }
        .act-info { display: flex; flex-direction: column; }
        .act-info strong { font-size: 0.95rem; }
        .act-info span { font-size: 0.8rem; color: var(--text-muted); }
        .act-score { text-align: right; display: flex; flex-direction: column; }
        .score-v { font-weight: 700; color: var(--primary); }
        .status-v { font-size: 0.75rem; color: var(--secondary); font-weight: 700; text-transform: uppercase; }
        .recommendation-card { background: var(--grad-accent); padding: 24px; border-radius: var(--radius-lg); color: white; display: flex; gap: 16px; }
        .rec-text h4 { margin-bottom: 4px; }
        .rec-text p { font-size: 0.9rem; opacity: 0.9; }
        .btn-full-outline { width: 100%; padding: 12px; border: 1px solid var(--surface-alt); background: white; border-radius: 12px; font-weight: 700; color: var(--text-main); cursor: pointer; }
        @media (max-width: 992px) { .dashboard-grid { grid-template-columns: 1fr; } .welcome-banner { flex-direction: column; text-align: center; } .welcome-illustration { display: none; } .assessment-grid-modern { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Dashboard;
