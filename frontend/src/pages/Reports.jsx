import React, { useEffect, useState } from 'react';
import { FileText, Download, Search, CheckCircle2, ArrowUpRight, ClipboardList, Activity, Brain, Mic, X, Printer } from 'lucide-react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── PDF Generator ─────────────────────────────────────────────────────────────
const generatePDF = (report, user) => {
  const doc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CogniFusion Clinical Report — ${report.report_id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 48px; color: #1e293b; }
        .header { border-bottom: 3px solid #4a90e2; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { font-size: 1.6rem; font-weight: 800; color: #4a90e2; }
        .brand small { display: block; font-size: 0.8rem; font-weight: 400; color: #64748b; }
        .report-id { text-align: right; color: #64748b; font-size: 0.88rem; }
        .report-id strong { font-size: 1.1rem; color: #1e293b; display: block; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { background: #f8fafc; padding: 14px 18px; border-radius: 8px; }
        .info-item label { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 4px; }
        .info-item strong { font-size: 1.05rem; color: #1e293b; }
        .risk-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 800; font-size: 1.1rem; }
        .risk-Low { background: #dcfce7; color: #16a34a; }
        .risk-Moderate { background: #fef9c3; color: #ca8a04; }
        .risk-High { background: #fee2e2; color: #dc2626; }
        .summary-box { background: #f0f7ff; border-left: 4px solid #4a90e2; padding: 18px 22px; border-radius: 6px; line-height: 1.7; color: #334155; }
        .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 0.82rem; color: #94a3b8; }
        @media print { body { padding: 24px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">CogniFusion<small>AI-Assisted Cognitive Health Assessment</small></div>
        <div class="report-id"><strong>${report.report_id}</strong>Generated: ${new Date(report.created_at).toLocaleString()}</div>
      </div>

      <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
          <div class="info-item"><label>Patient Name</label><strong>${user?.full_name || 'N/A'}</strong></div>
          <div class="info-item"><label>Patient ID</label><strong>${user?.patient_id || 'N/A'}</strong></div>
          <div class="info-item"><label>Date of Birth</label><strong>${user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}</strong></div>
          <div class="info-item"><label>Gender</label><strong>${user?.gender || 'N/A'}</strong></div>
          <div class="info-item"><label>Education</label><strong>${user?.educational_qualification || 'N/A'}</strong></div>
          <div class="info-item"><label>Report Type</label><strong>${report.report_type}</strong></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Risk Classification</div>
        <span class="risk-badge risk-${report.risk_level}">${report.risk_level} Risk</span>
      </div>

      <div class="section">
        <div class="section-title">Clinical Summary</div>
        <div class="summary-box">${report.summary || 'See attached assessment details.'}</div>
      </div>

      <div class="footer">
        <span>CogniFusion Clinical Report · Confidential Medical Document</span>
        <span>For screening purposes only. Not a definitive clinical diagnosis.</span>
      </div>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  win.document.write(doc);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
};

// ── Report Detail Modal ────────────────────────────────────────────────────────
const ReportModal = ({ report, user, onClose }) => {
  const riskColor = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
  const color = riskColor[report.risk_level] || '#64748b';

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x-btn" onClick={onClose}><X size={22} /></button>

        <div className="rm-header" style={{ borderLeft: `5px solid ${color}` }}>
          <div>
            <span className="rm-type">{report.report_type}</span>
            <h2>{report.title}</h2>
            <span className="rm-date">{new Date(report.created_at).toLocaleString()}</span>
          </div>
          <span className="rm-risk" style={{ background: color + '22', color }}>
            {report.risk_level} Risk
          </span>
        </div>

        <div className="rm-body">
          <div className="rm-id-row">
            <span>Report ID: <strong>{report.report_id}</strong></span>
            <span>Patient: <strong>{user?.full_name || 'N/A'}</strong></span>
          </div>
          <div className="rm-summary-section">
            <label>Clinical Summary</label>
            <p>{report.summary || 'No summary available for this report.'}</p>
          </div>
          {report.risk_level === 'High' && (
            <div className="rm-alert">
              <strong>⚠️ Elevated Risk Detected</strong>
              <p>This report indicates high cognitive risk. Please consult with a specialist as soon as possible.</p>
            </div>
          )}
        </div>

        <div className="rm-footer">
          <button className="rm-print-btn" onClick={() => generatePDF(report, user)}>
            <Printer size={18} /> Download PDF
          </button>
          <button className="rm-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Reports Page ─────────────────────────────────────────────────────────────
const Reports = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    reportService.getSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const scores = summary ? [
    { label: 'MMSE Score',       value: summary.scores.MMSE?.score ?? '--',  total: summary.scores.MMSE?.max_score ?? 30, level: summary.scores.MMSE?.adjusted_risk || summary.scores.MMSE?.risk_level || 'N/A', color: 'blue',   icon: <Brain size={20} /> },
    { label: 'MoCA Score',       value: summary.scores.MoCA?.score ?? '--',  total: summary.scores.MoCA?.max_score ?? 30, level: summary.scores.MoCA?.adjusted_risk || summary.scores.MoCA?.risk_level || 'N/A', color: 'purple', icon: <Activity size={20} /> },
    { label: 'Speech Stability', value: summary.scores.speech?.stability_pct ? `${summary.scores.speech.stability_pct}%` : '--', total: '100', level: summary.scores.speech?.risk_level ?? 'N/A', color: 'green', icon: <Mic size={20} /> },
    { label: 'MRI Atrophy',      value: summary.scores.mri?.atrophy_pct ? `${summary.scores.mri.atrophy_pct}%` : '--', total: '100%', level: summary.scores.mri?.risk_level ?? 'N/A', color: 'orange', icon: <Activity size={20} /> },
  ] : [];

  const allReports      = summary?.reports || [];
  const filteredReports = allReports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.report_type || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: 'var(--primary)', fontWeight: 600 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading your clinical reports...
    </div>
  );

  return (
    <div className="reports-modern animate-fade-up">
      <div className="container">
        {/* Score Cards */}
        {scores.length > 0 && (
          <section className="clinical-scores-grid mt-4">
            {scores.map((stat, i) => (
              <div key={i} className={`score-card-v2 accent-${stat.color}`}>
                <div className="stat-header-v2">
                  <div className="stat-icon-v2">{stat.icon}</div>
                  <span className={`level-pill pill-${stat.color}`}>{stat.level}</span>
                </div>
                <div className="stat-body-v2">
                  <div className="stat-value-v2"><span className="v-main">{stat.value}</span><span className="v-sub">/{stat.total}</span></div>
                  <p className="stat-label-v2">{stat.label}</p>
                </div>
                <div className="stat-footer-v2">
                  <div className="progress-mini-v2">
                    <div className="p-fill" style={{ width: `${Math.min(100, (parseFloat(stat.value) / parseFloat(stat.total)) * 100) || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ML Adjusted Score Banner */}
        {summary?.scores?.MoCA?.norm_percentile != null && (
          <div className="ml-banner card-modern mt-4">
            <div className="ml-banner-left">
              <div className="ml-banner-icon">🤖</div>
              <div>
                <h3>AI-Adjusted MoCA Score  <span className="ml-src-badge">NACC Model · 55K patients · AUC 97.4%</span></h3>
                <p>
                  Your MoCA score of <strong>{summary.scores.MoCA.score}</strong> vs.
                  expected <strong>{summary.scores.MoCA.norm_mean?.toFixed?.(1) ?? '–'}</strong> for your demographic group.
                  Placing you at the <strong>{summary.scores.MoCA.norm_percentile}th percentile</strong>.
                </p>
              </div>
            </div>
            <div className="ml-banner-right">
              <div className="ml-pct-dial" style={{
                background: `conic-gradient(${
                  summary.scores.MoCA.norm_percentile < 16 ? '#ef4444' :
                  summary.scores.MoCA.norm_percentile < 30 ? '#f59e0b' : '#10b981'
                } ${summary.scores.MoCA.norm_percentile * 3.6}deg, #e2e8f0 0deg)`
              }}>
                <div className="ml-pct-inner">
                  <span className="ml-pct-num">{summary.scores.MoCA.norm_percentile}</span>
                  <small>%ile</small>
                </div>
              </div>
              <span className="ml-adj-risk" style={{
                color: summary.scores.MoCA.adjusted_risk === 'High' ? '#ef4444' :
                       summary.scores.MoCA.adjusted_risk === 'Moderate' ? '#f59e0b' : '#10b981'
              }}>
                {summary.scores.MoCA.adjusted_risk} Risk
              </span>
            </div>
          </div>
        )}

        {/* Overall Risk */}

        {summary?.overall_risk && (
          <div className="card-modern risk-indicator-full mt-4">
            <div className="risk-content-v2">
              <div className="risk-meta-text">
                <Activity size={32} className="text-secondary mb-2" />
                <h2>Weighted Risk Profile: <span className="text-secondary">{summary.overall_risk}</span></h2>
                <p>Calculated as: Clinical Tests (40%) + Speech (30%) + MRI (30%)</p>
                {summary.risk_weights && (
                  <div className="weight-chips">
                    {Object.entries(summary.risk_weights).map(([k, v]) => (
                      <span key={k} className="weight-chip">{k.charAt(0).toUpperCase() + k.slice(1)}: {Math.round(v * 100)}%</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="risk-visual-v2">
                <div className="risk-spectrum">
                  <div className="spectrum-marker" style={{ left: summary.overall_risk === 'Low' ? '15%' : summary.overall_risk === 'Moderate' ? '50%' : '82%' }} />
                  <div className="spectrum-gradient" />
                  <div className="spectrum-labels"><span>Low Risk</span><span>Elevated</span><span>High Risk</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report History */}
        <section className="assessment-history card-modern mt-4">
          <div className="history-header">
            <h3><ClipboardList size={22} /> Assessment History</h3>
            <div className="filter-wrap">
              <Search size={18} className="text-muted" />
              <input type="text" placeholder="Filter clinical records..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>{allReports.length === 0 ? 'No reports yet. Complete an assessment to generate your first report.' : 'No reports match your search.'}</p>
            </div>
          ) : (
            <div className="record-list-v2">
              {filteredReports.map((rec, i) => {
                const riskColors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };
                const rc = riskColors[rec.risk_level] || '#94a3b8';
                return (
                  <div key={i} className="record-row-v2">
                    <div className="rec-info-v2" onClick={() => setSelected(rec)} style={{ cursor: 'pointer', flex: 1 }}>
                      <div className="rec-icon-v2" style={{ borderLeft: `3px solid ${rc}` }}><FileText size={20} /></div>
                      <div>
                        <h4>{rec.title}</h4>
                        <span className="rec-meta-v2">{rec.report_type} · {rec.report_id} · {new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="rec-action-v2">
                      <span className="rec-risk-pill" style={{ background: rc + '22', color: rc }}>{rec.risk_level}</span>
                      <button className="btn-icon-soft" title="Download PDF" onClick={() => generatePDF(rec, user)}>
                        <Download size={18} />
                      </button>
                      <button className="btn-icon-soft" title="View Details" onClick={() => setSelected(rec)}>
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selected && <ReportModal report={selected} user={user} onClose={() => setSelected(null)} />}

      <style>{`
        .reports-modern { padding: 40px 0; }
        .clinical-scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .score-card-v2 { background: white; padding: 24px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border-bottom: 4px solid var(--border-color); }
        .score-card-v2.accent-blue { border-color: var(--primary); } .score-card-v2.accent-purple { border-color: var(--accent); } .score-card-v2.accent-green { border-color: var(--secondary); } .score-card-v2.accent-orange { border-color: var(--warning); }
        .stat-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .stat-icon-v2 { width: 40px; height: 40px; background: #f8fafc; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .level-pill { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
        .pill-blue { background: #e0f2fe; color: var(--primary); } .pill-purple { background: #f5f3ff; color: var(--accent); } .pill-green { background: #dcfce7; color: var(--secondary); } .pill-orange { background: #fff7ed; color: var(--warning); }
        .stat-value-v2 { display: flex; align-items: baseline; gap: 2px; }
        .v-main { font-size: 2rem; font-weight: 800; color: var(--text-main); } .v-sub { font-size: 0.95rem; color: var(--text-muted); font-weight: 600; }
        .stat-label-v2 { color: var(--text-sub); font-size: 0.9rem; font-weight: 600; }
        .progress-mini-v2 { height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 16px; overflow: hidden; }
        .p-fill { height: 100%; background: var(--primary); border-radius: 2px; }
        .accent-purple .p-fill { background: var(--accent); } .accent-green .p-fill { background: var(--secondary); } .accent-orange .p-fill { background: var(--warning); }
        .risk-indicator-full { background: linear-gradient(to right, #ffffff, #f0fdf4); }
        .risk-content-v2 { display: flex; justify-content: space-between; align-items: center; gap: 40px; }
        .risk-meta-text { flex: 1; } .risk-visual-v2 { flex: 1.5; }
        .risk-meta-text p { color: var(--text-sub); margin-bottom: 12px; }
        .weight-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .weight-chip { background: #f0f7ff; color: var(--primary); font-size: 0.78rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; }
        .risk-spectrum { position: relative; height: 60px; display: flex; flex-direction: column; justify-content: center; }
        .spectrum-gradient { height: 12px; background: linear-gradient(to right, var(--secondary), var(--warning), var(--danger)); border-radius: 6px; }
        .spectrum-marker { position: absolute; top: 0; width: 4px; height: 36px; background: var(--text-main); border-radius: 2px; box-shadow: 0 0 10px rgba(0,0,0,0.2); transition: left 1s ease-in-out; }
        .spectrum-labels { display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .history-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-alt); padding-bottom: 24px; margin-bottom: 24px; }
        .filter-wrap { display: flex; align-items: center; gap: 12px; background: var(--background); padding: 10px 16px; border-radius: 12px; width: 300px; }
        .filter-wrap input { border: none; background: none; font-size: 0.9rem; width: 100%; outline: none; }
        .record-row-v2 { display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--surface-alt); border-radius: 16px; margin-bottom: 10px; transition: var(--transition); gap: 12px; }
        .record-row-v2:hover { background: #f8fbff; border-color: var(--primary); }
        .rec-info-v2 { display: flex; align-items: center; gap: 16px; }
        .rec-icon-v2 { width: 48px; height: 48px; background: #f3f4f6; color: var(--text-sub); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .rec-meta-v2 { font-size: 0.85rem; color: var(--text-muted); display: block; margin-top: 4px; }
        .rec-action-v2 { display: flex; gap: 8px; align-items: center; }
        .rec-risk-pill { font-size: 0.78rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .btn-icon-soft { width: 38px; height: 38px; border-radius: 10px; border: none; background: #f8fafc; color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .btn-icon-soft:hover { background: var(--surface-alt); color: var(--primary); }
        /* Report Modal */
        .report-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .report-modal-card { background: white; border-radius: 24px; width: 100%; max-width: 640px; overflow: hidden; position: relative; }
        .modal-x-btn { position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-sub); z-index: 10; }
        .rm-header { padding: 36px 36px 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding-left: 28px; border-bottom: 1px solid #f1f5f9; }
        .rm-type { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.06em; display: block; margin-bottom: 8px; }
        .rm-header h2 { font-size: 1.4rem; margin-bottom: 6px; }
        .rm-date { font-size: 0.82rem; color: var(--text-muted); }
        .rm-risk { padding: 10px 18px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; white-space: nowrap; }
        .rm-body { padding: 28px 36px; display: flex; flex-direction: column; gap: 20px; }
        .rm-id-row { display: flex; gap: 24px; font-size: 0.88rem; color: var(--text-sub); }
        .rm-id-row strong { color: var(--text-main); }
        .rm-summary-section label { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 10px; }
        .rm-summary-section p { background: #f8fafc; border-radius: 12px; padding: 18px; line-height: 1.7; font-size: 0.95rem; color: var(--text-main); }
        .rm-alert { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; }
        .rm-alert strong { color: #9f1239; display: block; margin-bottom: 6px; }
        .rm-alert p { color: #9f1239; font-size: 0.88rem; line-height: 1.5; }
        .rm-footer { display: flex; gap: 12px; padding: 20px 36px; border-top: 1px solid #f1f5f9; }
        .rm-print-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 1; justify-content: center; }
        .rm-close-btn { padding: 12px 24px; background: var(--background); border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: var(--text-sub); }
        @media (max-width: 992px) { .clinical-scores-grid { grid-template-columns: 1fr 1fr; } .risk-content-v2 { flex-direction: column; } }
        /* ML Banner */
        .ml-banner { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 28px; background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%); border: 1px solid #c4b5fd; }
        .ml-banner-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; }
        .ml-banner-icon { font-size: 2rem; flex-shrink: 0; }
        .ml-banner-left h3 { font-size: 1.05rem; margin-bottom: 8px; color: #4c1d95; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ml-src-badge { font-size: 0.7rem; font-weight: 700; background: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 20px; }
        .ml-banner-left p { font-size: 0.9rem; color: var(--text-sub); line-height: 1.6; }
        .ml-banner-right { display: flex; flex-direction: column; align-items: center; gap: 10px; flex-shrink: 0; }
        .ml-pct-dial { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .ml-pct-inner { width: 62px; height: 62px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ml-pct-num { font-size: 1.3rem; font-weight: 800; color: var(--text-main); line-height: 1; }
        .ml-pct-inner small { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; }
        .ml-adj-risk { font-size: 0.85rem; font-weight: 800; }
      `}</style>

    </div>
  );
};

export default Reports;
