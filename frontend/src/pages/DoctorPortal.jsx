import React, { useEffect, useState } from 'react';
import { doctorPortalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Brain, Mic, Upload, AlertTriangle, CheckCircle2,
  ChevronRight, X, FileText, PenLine, Stethoscope, Activity,
  Clock, User, GraduationCap, ArrowLeft
} from 'lucide-react';

// ── Risk Badge ────────────────────────────────────────────────────────────────
const RiskBadge = ({ risk }) => {
  const colors = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', 'No Data': '#94a3b8' };
  const bg     = { Low: '#f0fdf4', Moderate: '#fffbeb', High: '#fff1f2', 'No Data': '#f8fafc' };
  const color  = colors[risk] || '#94a3b8';
  return (
    <span style={{ background: bg[risk], color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
      {risk || 'No Data'}
    </span>
  );
};

// ── Patient Detail Modal ───────────────────────────────────────────────────────
const PatientModal = ({ patientId, doctorId, onClose }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [noteText, setNoteText] = useState('');
  const [prescNotes, setPrescNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]           = useState('overview');
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    doctorPortalService.getPatient(patientId)
      .then((r) => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await doctorPortalService.addNote({ patient_id: patientId, note: noteText });
      setMsg('✅ Note saved!');
      setNoteText('');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Failed to save note.'); }
    finally { setSubmitting(false); }
  };

  const handlePrescribe = async () => {
    setSubmitting(true);
    try {
      await doctorPortalService.prescribeMRI({ patient_id: patientId, notes: prescNotes });
      setMsg('✅ MRI scan prescribed. Patient has been notified.');
      setPrescNotes('');
      setTimeout(() => setMsg(''), 4000);
    } catch { setMsg('❌ Failed to prescribe MRI.'); }
    finally { setSubmitting(false); }
  };

  const p = data?.patient;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-big" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={22} /></button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--primary)', fontWeight: 600 }}>
            <div className="spin-ring" />Loading patient data...
          </div>
        ) : !data ? (
          <p style={{ padding: 40, textAlign: 'center' }}>Failed to load patient data.</p>
        ) : (
          <>
            {/* Patient Header */}
            <div className="modal-patient-header">
              <div className="modal-avatar">{p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
              <div>
                <h2>{p.full_name}</h2>
                <div className="modal-meta-row">
                  <span><User size={14} /> {p.gender || 'N/A'}</span>
                  <span><Clock size={14} /> DOB: {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                  <span><GraduationCap size={14} /> {p.educational_qualification || 'N/A'}</span>
                  <span><FileText size={14} /> {p.patient_id}</span>
                </div>
              </div>
            </div>

            {msg && <div className="msg-banner">{msg}</div>}

            {/* Tabs */}
            <div className="modal-tabs">
              {[['overview', 'Overview'], ['tests', 'Test Results'], ['reports', 'Reports'], ['actions', 'Doctor Actions']].map(([key, label]) => (
                <button key={key} className={`modal-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            <div className="modal-body">
              {tab === 'overview' && (
                <div className="overview-grid">
                  <div className="ov-card"><span>MMSE Score</span><strong>{data.tests?.find(t => t.test_type === 'MMSE')?.score ?? '—'}/30</strong></div>
                  <div className="ov-card"><span>MoCA Score</span><strong>{data.tests?.find(t => t.test_type === 'MoCA')?.score ?? '—'}/30</strong></div>
                  <div className="ov-card"><span>Speech Risk</span><strong>{data.speech?.[0]?.risk_level ?? '—'}</strong></div>
                  <div className="ov-card"><span>MRI Status</span><strong>{data.mri?.[0]?.status ?? 'Not uploaded'}</strong></div>
                  <div className="ov-card"><span>Total Tests</span><strong>{data.tests?.length || 0}</strong></div>
                  <div className="ov-card"><span>Prescriptions</span><strong>{data.prescriptions?.length || 0}</strong></div>
                </div>
              )}

              {tab === 'tests' && (
                <div>
                  {(data.tests || []).length === 0 ? <p className="empty-msg">No tests completed yet.</p> : (
                    data.tests.map((t, i) => (
                      <div key={i} className="list-row">
                        <div>
                          <strong>{t.test_type}</strong>
                          <span className="list-meta">{new Date(t.completed_at).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontWeight: 800 }}>{t.score}/{t.max_score}</span>
                          <RiskBadge risk={t.adjusted_risk || t.risk_level} />
                          {t.norm_percentile && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>P{Math.round(t.norm_percentile)}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'reports' && (
                <div>
                  {(data.reports || []).length === 0 ? <p className="empty-msg">No reports generated yet.</p> : (
                    data.reports.map((r, i) => (
                      <div key={i} className="list-row">
                        <div>
                          <strong>{r.title}</strong>
                          <span className="list-meta">{r.report_type} · {new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <RiskBadge risk={r.risk_level} />
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'actions' && (
                <div className="actions-tab">
                  {/* Add Note */}
                  <div className="action-block">
                    <h4><PenLine size={18} /> Add Clinical Note</h4>
                    <textarea placeholder="Write your clinical observations here..." rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    <button className="btn-action green" onClick={handleNote} disabled={submitting || !noteText.trim()}>Save Note</button>
                    {(data.doctor_notes || []).length > 0 && (
                      <div className="past-notes">
                        <strong>Past Notes:</strong>
                        {data.doctor_notes.map((n, i) => (
                          <div key={i} className="past-note">
                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                            <p>{n.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prescribe MRI */}
                  <div className="action-block">
                    <h4><Upload size={18} /> Prescribe MRI Scan</h4>
                    <textarea placeholder="Add notes for the patient about the MRI prescription..." rows={3} value={prescNotes} onChange={(e) => setPrescNotes(e.target.value)} />
                    <button className="btn-action blue" onClick={handlePrescribe} disabled={submitting}>Prescribe MRI</button>
                    {(data.prescriptions || []).length > 0 && (
                      <div className="past-notes">
                        <strong>Past Prescriptions:</strong>
                        {data.prescriptions.map((pr, i) => (
                          <div key={i} className="past-note">
                            <span>{new Date(pr.prescribed_at).toLocaleDateString()} · Status: <strong>{pr.status}</strong></span>
                            <p>{pr.notes || 'No notes.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Doctor Portal Main ─────────────────────────────────────────────────────────
const DoctorPortal = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    doctorPortalService.getPatients()
      .then((r) => setPatients(r.data.data || []))
      .catch(() => setError('Failed to load patients. Ensure you are logged in as a doctor.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  const riskColor = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', 'No Data': '#94a3b8' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: 'var(--primary)', fontWeight: 600 }}>
      <div className="spin-ring" />Loading patient registry...
      <style>{`.spin-ring{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="dp-page container animate-fade-up">
      {/* Header */}
      <div className="dp-header">
        <div className="dp-header-left">
          <div className="dp-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>Doctor Portal</h1>
            <p>Welcome, Dr. {user?.full_name?.split(' ')[0]}. Manage patients, review assessments, and prescribe MRI scans.</p>
          </div>
        </div>
        <div className="dp-stats">
          <div className="dp-stat"><span>{patients.length}</span><label>Patients</label></div>
          <div className="dp-stat"><span style={{ color: '#ef4444' }}>{patients.filter(p => p.overall_risk === 'High').length}</span><label>High Risk</label></div>
          <div className="dp-stat"><span style={{ color: '#f59e0b' }}>{patients.filter(p => p.overall_risk === 'Moderate').length}</span><label>Moderate</label></div>
        </div>
      </div>

      {error && <div className="alert-block alert-danger">{error}</div>}

      {/* Search */}
      <div className="dp-search-bar">
        <input type="text" placeholder="Search by name, email, or patient ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Patient Table */}
      <div className="patient-table card-modern">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Education</th>
              <th>MMSE</th>
              <th>MoCA</th>
              <th>Speech Risk</th>
              <th>Overall Risk</th>
              <th>Tests Done</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No patients found.</td></tr>
            ) : filtered.map((p) => {
              const age = p.date_of_birth
                ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
                : '—';
              return (
                <tr key={p.id} className="patient-row" onClick={() => setSelected(p.id)}>
                  <td>
                    <div className="p-name-cell">
                      <div className="p-mini-avatar">{p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div>
                        <strong>{p.full_name}</strong>
                        <span>{p.patient_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{age} / {p.gender || '—'}</td>
                  <td style={{ maxWidth: 130, fontSize: '0.82rem' }}>{p.educational_qualification || '—'}</td>
                  <td><strong>{p.latest_mmse?.score ?? '—'}</strong>{p.latest_mmse && '/30'}</td>
                  <td><strong>{p.latest_moca?.score ?? '—'}</strong>{p.latest_moca && '/30'}</td>
                  <td><RiskBadge risk={p.latest_speech_risk} /></td>
                  <td><span style={{ color: riskColor[p.overall_risk], fontWeight: 800 }}>{p.overall_risk}</span></td>
                  <td>{p.tests_completed}</td>
                  <td><button className="view-btn"><ChevronRight size={18} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Patient Detail Modal */}
      {selected && <PatientModal patientId={selected} doctorId={user?.id} onClose={() => setSelected(null)} />}

      <style>{`
        .dp-page { padding: 40px 0; }
        .dp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .dp-header-left { display: flex; align-items: center; gap: 20px; }
        .dp-icon { width: 60px; height: 60px; background: var(--grad-primary); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .dp-header-left h1 { font-size: 2rem; margin-bottom: 6px; }
        .dp-header-left p { color: var(--text-sub); max-width: 500px; }
        .dp-stats { display: flex; gap: 20px; }
        .dp-stat { background: white; padding: 16px 24px; border-radius: 14px; box-shadow: var(--shadow-sm); text-align: center; min-width: 80px; }
        .dp-stat span { font-size: 2rem; font-weight: 800; color: var(--text-main); display: block; }
        .dp-stat label { font-size: 0.78rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        .alert-block { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 0.9rem; font-weight: 600; }
        .alert-danger { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        .dp-search-bar { margin-bottom: 24px; }
        .dp-search-bar input { width: 100%; padding: 14px 20px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1rem; box-sizing: border-box; outline: none; }
        .dp-search-bar input:focus { border-color: var(--primary); }
        .patient-table { overflow-x: auto; }
        .patient-table table { width: 100%; border-collapse: collapse; }
        .patient-table th { text-align: left; padding: 12px 16px; font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; background: var(--background); border-bottom: 1px solid #f1f5f9; }
        .patient-row { cursor: pointer; transition: background 0.15s; }
        .patient-row:hover { background: #f8fbff; }
        .patient-row td { padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 0.9rem; vertical-align: middle; }
        .p-name-cell { display: flex; align-items: center; gap: 12px; }
        .p-mini-avatar { width: 38px; height: 38px; border-radius: 10px; background: var(--grad-primary); color: white; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .p-name-cell strong { display: block; }
        .p-name-cell span { font-size: 0.78rem; color: var(--text-muted); }
        .view-btn { background: var(--background); border: none; border-radius: 8px; padding: 6px; cursor: pointer; color: var(--text-sub); display: flex; align-items: center; }
        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-big { background: white; border-radius: 24px; width: 100%; max-width: 840px; max-height: 90vh; overflow-y: auto; position: relative; }
        .modal-close-btn { position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-sub); z-index: 10; }
        .modal-patient-header { display: flex; align-items: center; gap: 20px; padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; }
        .modal-avatar { width: 72px; height: 72px; border-radius: 18px; background: var(--grad-primary); color: white; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .modal-patient-header h2 { font-size: 1.6rem; margin-bottom: 8px; }
        .modal-meta-row { display: flex; flex-wrap: wrap; gap: 14px; }
        .modal-meta-row span { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; color: var(--text-sub); font-weight: 500; }
        .msg-banner { margin: 0 32px; padding: 12px 16px; background: #f0fdf4; color: #065f46; border-radius: 10px; font-size: 0.9rem; font-weight: 600; border: 1px solid #a7f3d0; }
        .modal-tabs { display: flex; gap: 0; border-bottom: 1px solid #f1f5f9; padding: 0 32px; }
        .modal-tab { background: none; border: none; border-bottom: 3px solid transparent; padding: 14px 20px; font-size: 0.9rem; font-weight: 700; color: var(--text-sub); cursor: pointer; transition: all 0.2s; }
        .modal-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .modal-body { padding: 28px 32px 40px; }
        .overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .ov-card { background: var(--background); border-radius: 12px; padding: 20px; }
        .ov-card span { font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px; }
        .ov-card strong { font-size: 1.8rem; font-weight: 800; color: var(--text-main); }
        .list-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f8fafc; }
        .list-row strong { display: block; font-size: 0.95rem; }
        .list-meta { font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 2px; }
        .empty-msg { text-align: center; padding: 40px; color: var(--text-muted); }
        .actions-tab { display: flex; flex-direction: column; gap: 32px; }
        .action-block { background: var(--background); padding: 24px; border-radius: 16px; display: flex; flex-direction: column; gap: 12px; }
        .action-block h4 { display: flex; align-items: center; gap: 8px; font-size: 1rem; color: var(--text-main); margin: 0; }
        .action-block textarea { padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; resize: vertical; font-family: inherit; }
        .action-block textarea:focus { outline: none; border-color: var(--primary); }
        .btn-action { padding: 12px 24px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.95rem; align-self: flex-start; }
        .btn-action.green { background: #10b981; color: white; }
        .btn-action.blue  { background: var(--primary); color: white; }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .past-notes { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 4px; display: flex; flex-direction: column; gap: 10px; }
        .past-notes > strong { font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; }
        .past-note { background: white; border-radius: 8px; padding: 10px 14px; }
        .past-note span { font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .past-note p { font-size: 0.88rem; color: var(--text-main); margin: 0; }
        .spin-ring { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DoctorPortal;
