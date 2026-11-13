import React, { useEffect, useState } from 'react';
import { doctorPortalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Brain, Mic, Upload, AlertTriangle, CheckCircle2,
  ChevronRight, X, FileText, PenLine, Stethoscope, Activity,
  Clock, User, GraduationCap, ArrowLeft, Video, MessageSquare,
  ShieldCheck, Sparkles, PhoneOff, ExternalLink, RefreshCw, Eye, Save
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

// ── Teleconsultation Meeting Room for Doctor ──────────────────────────────────
const DoctorMeetingRoom = ({ consultation, doctorUser, onClose, onNoteSaved }) => {
  const [activeTab, setActiveTab]         = useState('records'); // 'records' | 'notes' | 'chat'
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // Clinical Notes & Improvement Form
  const [clinicalImpression, setImpression] = useState('');
  const [targetedImprovements, setImprovements] = useState('');
  const [prescriptions, setPrescriptions]   = useState('');
  const [savingNote, setSavingNote]         = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { sender: 'system', text: 'Secure WebRTC teleconsultation session initiated.' },
    { sender: 'doctor', text: `Hello ${consultation.patient?.full_name || 'there'}, Dr. ${doctorUser?.full_name} has joined the room.` }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Call timer
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (consultation.user_id) {
      doctorPortalService.getPatient(consultation.user_id)
        .then((r) => setPatientDetails(r.data.data))
        .catch((err) => {
          console.error('[Doctor Meeting - patient records]', err);
          setPatientDetails(null);
        })
        .finally(() => setLoadingPatient(false));
    }
  }, [consultation.user_id]);

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!clinicalImpression.trim() && !targetedImprovements.trim()) return;
    setSavingNote(true);
    try {
      await doctorPortalService.addNote({
        patient_id: consultation.user_id,
        note: clinicalImpression,
        improvements: targetedImprovements,
        diagnosis: prescriptions,
      });
      setSaveSuccess(true);
      if (onNoteSaved) onNoteSaved();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'doctor', text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const p = patientDetails?.patient || consultation.patient || {};
  const mri = patientDetails?.mri?.[0];
  const mmse = patientDetails?.tests?.find(t => t.test_type === 'MMSE');
  const moca = patientDetails?.tests?.find(t => t.test_type === 'MoCA');
  const clock = patientDetails?.tests?.find(t => t.test_type === 'ClockDrawing');
  const trail = patientDetails?.tests?.find(t => t.test_type === 'TrailMaking');

  return (
    <div className="doc-room-overlay">
      <div className="doc-room-card">
        {/* Header */}
        <div className="doc-room-header">
          <div className="drh-left">
            <span className="live-pill"><span className="live-dot" /> LIVE TELECONSULTATION</span>
            <div>
              <h2>Consultation with {p.full_name || 'Patient'}</h2>
              <p>Patient ID: <strong>{p.patient_id || 'N/A'}</strong> · Dr. {doctorUser?.full_name}</p>
            </div>
          </div>
          <div className="drh-right">
            <div className="call-timer"><Clock size={16} /> {formatTimer(duration)}</div>
            <a
              href={consultation.meeting_url || undefined}
              target="_blank"
              rel="noreferrer"
              className="btn-room-tool"
              title="Open full video window"
              onClick={(event) => {
                if (!consultation.meeting_url) event.preventDefault();
              }}
            >
              <ExternalLink size={16} /> Full Window
            </a>
            <button className="btn-close-room" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Room Body: Video on Left, Clinical Workspace on Right */}
        <div className="doc-room-grid">
          {/* Left Column: Video & Chat */}
          <div className="video-col">
            <div className="video-frame-container">
              <div className="meet-link-panel">
                <Video size={36} />
                <h3>Google Meet</h3>
                <p>Open the shared meeting link to join the patient. The patient uses this same link.</p>
                {consultation.meeting_url ? (
                  <a href={consultation.meeting_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> Open Google Meet
                  </a>
                ) : (
                  <span>Add a Google Meet link to this appointment before joining.</span>
                )}
              </div>
            </div>

            {/* In-Call Discussion Chat */}
            <div className="room-chat-box">
              <div className="chat-header">
                <MessageSquare size={16} />
                <span>Live Discussion Chat</span>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.sender}`}>
                    <span className="chat-sender">{msg.sender === 'doctor' ? 'You (Dr)' : msg.sender === 'patient' ? p.full_name : 'System'}</span>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="chat-form">
                <input
                  type="text"
                  placeholder="Type message to patient..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>

          {/* Right Column: Shared Records & Improvement Notes Form */}
          <div className="workspace-col">
            <div className="workspace-tabs">
              <button
                className={`ws-tab ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => setActiveTab('records')}
              >
                <Brain size={16} /> Patient MRI & Test Records
              </button>
              <button
                className={`ws-tab ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <PenLine size={16} /> Improvement Notes & Rx
              </button>
            </div>

            {/* TAB: Shared MRI & Cognitive Records */}
            {activeTab === 'records' && (
              <div className="ws-content records-view">
                {loadingPatient ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><div className="spin-ring" /> Loading patient records...</div>
                ) : (
                  <>
                    {/* Patient Overview Chips */}
                    <div className="patient-demographics-bar">
                      <span><strong>Gender:</strong> {p.gender || '—'}</span>
                      <span><strong>DOB:</strong> {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}</span>
                      <span><strong>Education:</strong> {p.educational_qualification || '—'}</span>
                    </div>

                    {/* Shared MRI Scan Card */}
                    <div className="record-panel-card">
                      <div className="rpc-title">
                        <Brain size={18} color="#10b981" />
                        <h4>MRI Neuroimaging Findings</h4>
                      </div>
                      {mri ? (
                        <div className="mri-shared-content">
                          <div className="mri-thumb-box">
                            {mri.file_url
                              ? <img src={mri.file_url} alt={`Uploaded scan: ${mri.file_name}`} className="mri-thumb" />
                              : <span className="mri-no-preview">Original scan preview unavailable</span>}
                            <span className="mri-risk-tag" style={{ background: mri.risk_level === 'High' ? '#fee2e2' : mri.risk_level === 'Moderate' ? '#fef3c7' : '#dcfce7', color: mri.risk_level === 'High' ? '#dc2626' : mri.risk_level === 'Moderate' ? '#d97706' : '#16a34a' }}>
                              {mri.risk_level} Risk
                            </span>
                          </div>
                          <div className="mri-shared-details">
                            <p><strong>Scan:</strong> {mri.file_name}</p>
                            <p><strong>Hippocampal Volume:</strong> {Number(mri.hippocampal_vol || 0).toFixed(0)} mm³</p>
                            <p><strong>Cortical Atrophy:</strong> {Number(mri.atrophy_pct || 0).toFixed(1)}%</p>
                            <p className="mri-notes-text"><em>{mri.analysis_notes}</em></p>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No MRI scans uploaded by patient yet.</p>
                      )}
                    </div>

                    {/* Cognitive Test Matrix */}
                    <div className="record-panel-card">
                      <div className="rpc-title">
                        <Activity size={18} color="#6366f1" />
                        <h4>Clinical Cognitive Battery Scores</h4>
                      </div>
                      <div className="battery-scores-grid">
                        <div className="bsc-item">
                          <span>MMSE Score</span>
                          <strong>{mmse ? `${mmse.score} / ${mmse.max_score}` : 'Not taken'}</strong>
                          {mmse && <RiskBadge risk={mmse.risk_level} />}
                        </div>
                        <div className="bsc-item">
                          <span>MoCA Score</span>
                          <strong>{moca ? `${moca.score} / ${moca.max_score}` : 'Not taken'}</strong>
                          {moca && <RiskBadge risk={moca.adjusted_risk || moca.risk_level} />}
                        </div>
                        <div className="bsc-item">
                          <span>Clock Drawing</span>
                          <strong>{clock ? `${clock.score} / 5` : 'Not taken'}</strong>
                          {clock && <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800 }}>Evaluated</span>}
                        </div>
                        <div className="bsc-item">
                          <span>Trail Making</span>
                          <strong>{trail ? `${trail.score} / 100` : 'Not taken'}</strong>
                          {trail && <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 800 }}>TMT-A/B</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB: Doctor Clinical Improvement Notes Form */}
            {activeTab === 'notes' && (
              <form onSubmit={handleSaveNotes} className="ws-content notes-form-view">
                {saveSuccess && (
                  <div className="save-success-banner">
                    <CheckCircle2 size={18} />
                    <span>Clinical recommendations transmitted & saved to patient record!</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Clinical Observations & Diagnostic Impression *</label>
                  <textarea
                    placeholder="Document clinical discussion, observed speech stability, orientation, and memory recall status..."
                    rows={3}
                    value={clinicalImpression}
                    onChange={(e) => setImpression(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Targeted Areas Where Patient Needs Improvements *</label>
                  <textarea
                    placeholder="Specify exact cognitive areas for improvement (e.g., delayed verbal recall exercises, visuospatial clock orientation, speech pacing)..."
                    rows={3}
                    value={targetedImprovements}
                    onChange={(e) => setImprovements(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Prescriptions & Recommended Next Steps</label>
                  <textarea
                    placeholder="Prescribe MRI volumetric follow-up, cognitive therapy schedule, lifestyle or medication recommendations..."
                    rows={2}
                    value={prescriptions}
                    onChange={(e) => setPrescriptions(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-save-notes" disabled={savingNote}>
                  <ShieldCheck size={18} />
                  {savingNote ? 'Saving Notes...' : 'Save & Sync Recommendations to Patient'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Patient Detail Modal ───────────────────────────────────────────────────────
const PatientModal = ({ patientId, doctorId, onClose }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [noteText, setNoteText] = useState('');
  const [impText, setImpText]   = useState('');
  const [prescNotes, setPrescNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]           = useState('overview');
  const [msg, setMsg]           = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

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
      await doctorPortalService.addNote({
        patient_id: patientId,
        note: noteText,
        improvements: impText
      });
      setMsg('✅ Improvement note saved & synced to patient!');
      setNoteText('');
      setImpText('');
      setTimeout(() => setMsg(''), 3500);
    } catch { setMsg('❌ Failed to save note.'); }
    finally { setSubmitting(false); }
  };

  const handlePrescribe = async () => {
    setSubmitting(true);
    try {
      await doctorPortalService.prescribeMRI({ patient_id: patientId, notes: prescNotes });
      const refreshed = await doctorPortalService.getPatient(patientId);
      setData(refreshed.data.data);
      setMsg('✅ MRI scan prescribed. Patient has been notified.');
      setPrescNotes('');
      setTimeout(() => setMsg(''), 4000);
    } catch { setMsg('❌ Failed to prescribe MRI.'); }
    finally { setSubmitting(false); }
  };

  const handleReviewMRI = async (scan, reviewStatus) => {
    setSubmitting(true);
    try {
      const { data: response } = await doctorPortalService.reviewMRI(scan.id, {
        review_status: reviewStatus,
        review_notes: reviewNotes,
      });
      setData((current) => ({
        ...current,
        mri: current.mri.map((item) => item.id === scan.id ? response.data : item),
      }));
      setMsg(reviewStatus === 'approved' ? '✅ MRI result approved.' : 'Follow-up requested; patient can see your note.');
      setReviewNotes('');
    } catch (err) {
      setMsg(err.response?.data?.message || '❌ Failed to save MRI review.');
    } finally {
      setSubmitting(false);
    }
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
              {[['overview', 'Overview'], ['tests', 'Test Results'], ['mri', 'MRI Review'], ['reports', 'Reports'], ['actions', 'Doctor Actions']].map(([key, label]) => (
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

              {tab === 'mri' && (
                <div className="mri-review-list">
                  {(data.mri || []).length === 0 ? <p className="empty-msg">No MRI scans uploaded yet.</p> : (
                    data.mri.map((scan) => {
                      const prescription = (data.prescriptions || []).find((item) => item.id === scan.mri_prescription_id);
                      const assignedToCurrentDoctor = prescription?.doctor_id === doctorId;
                      return (
                        <div className="mri-review-card" key={scan.id}>
                          <div className="mri-review-heading">
                            <div>
                              <strong>{scan.file_name}</strong>
                              <span>{new Date(scan.submitted_at || scan.analyzed_at).toLocaleString()}</span>
                            </div>
                            <span className={`mri-review-status ${scan.review_status || 'pending'}`}>
                              {(scan.review_status || 'pending').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p><strong>Model result:</strong> {scan.risk_level || scan.status} {scan.atrophy_pct != null ? `· ${scan.atrophy_pct}% estimated atrophy` : ''}</p>
                          {scan.analysis_notes && <p>{scan.analysis_notes}</p>}
                          {scan.review_notes && <p><strong>Doctor note:</strong> {scan.review_notes}</p>}
                          {scan.file_url && <a href={scan.file_url} target="_blank" rel="noreferrer">Open uploaded scan <ExternalLink size={14} /></a>}
                          {assignedToCurrentDoctor && (scan.review_status || 'pending') === 'pending' && (
                            <div className="mri-review-actions">
                              <textarea
                                aria-label="MRI review note"
                                placeholder="Optional review note for the patient"
                                rows={2}
                                value={reviewNotes}
                                onChange={(event) => setReviewNotes(event.target.value)}
                              />
                              <div>
                                <button
                                  disabled={submitting || scan.status === 'failed' || !scan.risk_level}
                                  onClick={() => handleReviewMRI(scan, 'approved')}
                                >
                                  Approve result
                                </button>
                                <button disabled={submitting} className="follow-up" onClick={() => handleReviewMRI(scan, 'needs_follow_up')}>Request follow-up</button>
                              </div>
                              {(scan.status === 'failed' || !scan.risk_level) && (
                                <span className="mri-unlinked-note">No model result is available to approve. Request a follow-up scan.</span>
                              )}
                            </div>
                          )}
                          {!prescription && <span className="mri-unlinked-note">This scan was not uploaded against an MRI prescription and cannot be reviewed here.</span>}
                        </div>
                      );
                    })
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
                  {/* Add Improvement Note */}
                  <div className="action-block">
                    <h4><PenLine size={18} /> Record Clinical Observation & Targeted Improvements</h4>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>Clinical Impressions:</label>
                    <textarea placeholder="Clinical notes on cognitive status and observations..." rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginTop: '6px' }}>Areas Where Patient Needs Improvements:</label>
                    <textarea placeholder="Specific cognitive areas to improve (e.g. delayed recall, executive set-shifting)..." rows={2} value={impText} onChange={(e) => setImpText(e.target.value)} />
                    <button className="btn-action green" onClick={handleNote} disabled={submitting || !noteText.trim()}>Save & Transmit to Patient</button>
                    {(data.doctor_notes || []).length > 0 && (
                      <div className="past-notes">
                        <strong>Past Notes:</strong>
                        {data.doctor_notes.map((n, i) => (
                          <div key={i} className="past-note">
                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                            <p>{n.note}</p>
                            {n.improvements && <p style={{ color: '#4f46e5', fontWeight: 600 }}>Targeted: {n.improvements}</p>}
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
  const [activeMainTab, setActiveMainTab] = useState('patients'); // 'patients' | 'consultations'
  const [patients, setPatients]           = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetingUrlDrafts, setMeetingUrlDrafts] = useState({});
  const [savingMeetingId, setSavingMeetingId] = useState('');
  const [meetingMessages, setMeetingMessages] = useState({});

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [patRes, conRes] = await Promise.all([
        doctorPortalService.getPatients(),
        doctorPortalService.getConsultations().catch(() => ({ data: { data: [] } })),
      ]);
      setPatients(patRes.data.data || []);
      setConsultations(conRes.data?.data || []);
    } catch {
      setError('Failed to load doctor portal data. Please verify your doctor credentials.');
    } finally {
      setLoading(false);
    }
  };

  const saveMeetingUrl = async (consultation) => {
    const meetingUrl = (meetingUrlDrafts[consultation.id] || consultation.meeting_url || '').trim();
    if (!meetingUrl) {
      setMeetingMessages((messages) => ({ ...messages, [consultation.id]: 'Enter a Google Meet link.' }));
      return;
    }

    setSavingMeetingId(consultation.id);
    try {
      const { data } = await doctorPortalService.updateMeetingUrl(consultation.id, meetingUrl);
      setConsultations((items) => items.map((item) =>
        item.id === consultation.id ? { ...item, meeting_url: data.data.meeting_url } : item
      ));
      setMeetingMessages((messages) => ({ ...messages, [consultation.id]: 'Meet link saved for both participants.' }));
    } catch (err) {
      setMeetingMessages((messages) => ({
        ...messages,
        [consultation.id]: err.response?.data?.message || 'Failed to save the Meet link.',
      }));
    } finally {
      setSavingMeetingId('');
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  const riskColor = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', 'No Data': '#94a3b8' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: 'var(--primary)', fontWeight: 600 }}>
      <div className="spin-ring" />Loading Doctor Clinical Portal...
    </div>
  );

  return (
    <div className="dp-page container animate-fade-up">
      {/* Doctor Header Banner */}
      <div className="dp-header">
        <div className="dp-header-left">
          <div className="dp-icon"><Stethoscope size={28} /></div>
          <div>
            <div className="doc-verified-tag">
              <ShieldCheck size={14} /> Licensed Neurologist & Specialist
            </div>
            <h1>Doctor Clinical Portal</h1>
            <p>
              Signed in as <strong>{user?.full_name?.startsWith('Dr.') ? user.full_name : `Dr. ${user?.full_name}`}</strong> ({user?.email})
            </p>
          </div>
        </div>
        <div className="dp-stats">
          <div className="dp-stat"><span>{patients.length}</span><label>Patients</label></div>
          <div className="dp-stat"><span style={{ color: '#10b981' }}>{consultations.length}</span><label>Meetings</label></div>
          <div className="dp-stat"><span style={{ color: '#ef4444' }}>{patients.filter(p => p.overall_risk === 'High').length}</span><label>High Risk</label></div>
        </div>
      </div>

      {error && <div className="alert-block alert-danger">{error}</div>}

      {/* Main Tabs: Patients Directory vs Teleconsultations */}
      <div className="dp-nav-tabs">
        <button
          className={`dp-nav-btn ${activeMainTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('patients')}
        >
          <Users size={18} />
          <span>Patient Registry ({patients.length})</span>
        </button>
        <button
          className={`dp-nav-btn ${activeMainTab === 'consultations' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('consultations')}
        >
          <Video size={18} />
          <span>Teleconsultations & Meetings ({consultations.length})</span>
        </button>
      </div>

      {/* ─── VIEW 1: Patient Registry ─── */}
      {activeMainTab === 'patients' && (
        <>
          <div className="dp-search-bar">
            <input
              type="text"
              placeholder="Search patients by name, email, or patient ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No patients found.</td></tr>
                ) : filteredPatients.map((p) => {
                  const age = p.date_of_birth
                    ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
                    : '—';
                  return (
                    <tr key={p.id} className="patient-row" onClick={() => setSelectedPatientId(p.id)}>
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
        </>
      )}

      {/* ─── VIEW 2: Teleconsultations & Meetings ─── */}
      {activeMainTab === 'consultations' && (
        <div className="consultations-view">
          <div className="con-header-row">
            <div>
              <h2>Scheduled Teleconsultations</h2>
              <p>Join live teleconsultation rooms, review patient MRI and cognitive test results, and save improvement notes.</p>
            </div>
            <button className="btn-refresh" onClick={loadPortalData}>
              <RefreshCw size={16} /> Refresh Schedule
            </button>
          </div>

          {consultations.length === 0 ? (
            <div className="card-modern empty-state">
              <Video size={48} className="text-muted" />
              <h3>No Appointments Scheduled Yet</h3>
              <p>Patients booked for your clinical schedule will appear here automatically.</p>
            </div>
          ) : (
            <div className="consultations-grid">
              {consultations.map((c) => (
                <div key={c.id} className="card-modern doc-con-card">
                  <div className="dcc-top">
                    <div className="dcc-patient">
                      <div className="p-avatar-sm">
                        {(c.patient?.full_name || 'Patient').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4>{c.patient?.full_name || 'Patient'}</h4>
                        <span>ID: {c.patient?.patient_id || 'CF-PATIENT'}</span>
                      </div>
                    </div>
                    <span className="status-badge upcoming">● Upcoming Session</span>
                  </div>

                  <div className="dcc-time-row">
                    <span><Clock size={14} /> {new Date(c.scheduled_at).toLocaleString()}</span>
                  </div>

                  {c.notes && (
                    <div className="dcc-concern">
                      <strong>Patient Concern:</strong>
                      <p>{c.notes}</p>
                    </div>
                  )}

                  <div className="meeting-link-editor">
                    <label htmlFor={`meet-url-${c.id}`}>Shared Google Meet URL</label>
                    <div>
                      <input
                        id={`meet-url-${c.id}`}
                        type="url"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={meetingUrlDrafts[c.id] ?? c.meeting_url ?? ''}
                        onChange={(event) => setMeetingUrlDrafts((drafts) => ({ ...drafts, [c.id]: event.target.value }))}
                      />
                      <button onClick={() => saveMeetingUrl(c)} disabled={savingMeetingId === c.id}>
                        <Save size={15} /> {savingMeetingId === c.id ? 'Saving' : 'Save link'}
                      </button>
                    </div>
                    {meetingMessages[c.id] && <span className="meeting-link-message">{meetingMessages[c.id]}</span>}
                    {c.meeting_url && (
                      <a href={c.meeting_url} target="_blank" rel="noreferrer" className="meet-join-link">
                        <ExternalLink size={14} /> Open saved Google Meet
                      </a>
                    )}
                  </div>

                  <div className="dcc-actions">
                    <button
                      className="btn-join-teleconsult"
                      onClick={() => {
                        setActiveMeeting(c);
                        window.open(c.meeting_url, '_blank', 'noopener,noreferrer');
                      }}
                      disabled={!c.meeting_url}
                      title={!c.meeting_url ? 'Save a Google Meet link before joining.' : undefined}
                    >
                      <Video size={16} /> Review Patient & Meeting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatientId && (
        <PatientModal
          patientId={selectedPatientId}
          doctorId={user?.id}
          onClose={() => setSelectedPatientId(null)}
        />
      )}

      {/* Interactive Doctor Teleconsultation Meeting Room */}
      {activeMeeting && (
        <DoctorMeetingRoom
          consultation={activeMeeting}
          doctorUser={user}
          onClose={() => setActiveMeeting(null)}
          onNoteSaved={loadPortalData}
        />
      )}

      <style>{`
        .dp-page { padding: 40px 0 80px; }
        .dp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
        .dp-header-left { display: flex; align-items: center; gap: 20px; }
        .dp-icon { width: 64px; height: 64px; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 16px rgba(37,99,235,0.25); }
        .doc-verified-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 2px 10px; border-radius: 12px; margin-bottom: 6px; }
        .dp-header-left h1 { font-size: 2.2rem; margin-bottom: 4px; }
        .dp-header-left p { color: var(--text-sub); }
        .dp-stats { display: flex; gap: 16px; }
        .dp-stat { background: white; padding: 14px 22px; border-radius: 14px; box-shadow: var(--shadow-sm); text-align: center; border: 1.5px solid #e2e8f0; }
        .dp-stat span { font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: block; }
        .dp-stat label { font-size: 0.74rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }

        /* Tabs */
        .dp-nav-tabs { display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .dp-nav-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: none; border: none; font-size: 0.95rem; font-weight: 700; color: var(--text-sub); cursor: pointer; border-radius: 12px; transition: var(--transition); }
        .dp-nav-btn:hover { background: #f1f5f9; color: var(--text-main); }
        .dp-nav-btn.active { background: #e0f2fe; color: #0369a1; }

        .dp-search-bar { margin-bottom: 20px; }
        .dp-search-bar input { width: 100%; padding: 14px 20px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 1rem; outline: none; background: white; }
        .patient-table { overflow-x: auto; }
        .patient-table table { width: 100%; border-collapse: collapse; }
        .patient-table th { text-align: left; padding: 12px 16px; font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .patient-row { cursor: pointer; transition: background 0.15s; }
        .patient-row:hover { background: #f0f7ff; }
        .patient-row td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
        .p-name-cell { display: flex; align-items: center; gap: 12px; }
        .p-mini-avatar { width: 38px; height: 38px; border-radius: 10px; background: #3b82f6; color: white; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .view-btn { background: #f1f5f9; border: none; border-radius: 8px; padding: 6px; cursor: pointer; }

        /* Consultations View */
        .con-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-refresh { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1.5px solid #cbd5e1; background: white; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .consultations-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .doc-con-card { padding: 24px; display: flex; flex-direction: column; gap: 14px; border: 1.5px solid #e2e8f0; }
        .dcc-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .dcc-patient { display: flex; align-items: center; gap: 12px; }
        .p-avatar-sm { width: 44px; height: 44px; border-radius: 12px; background: #0284c7; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .status-badge.upcoming { background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; }
        .dcc-time-row { display: flex; align-items: center; gap: 8px; color: var(--text-sub); font-size: 0.9rem; }
        .dcc-concern { background: #f8fafc; padding: 12px 14px; border-radius: 10px; font-size: 0.88rem; }
        .dcc-concern strong { display: block; margin-bottom: 2px; color: var(--text-main); }
        .dcc-concern p { margin: 0; color: var(--text-sub); }
        .btn-join-teleconsult { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .btn-join-teleconsult:disabled { opacity: .5; cursor: not-allowed; }
        .meeting-link-editor { padding: 12px; background: #f8fafc; border-radius: 10px; display: flex; flex-direction: column; gap: 7px; }
        .meeting-link-editor label { font-size: .78rem; font-weight: 800; color: #475569; }
        .meeting-link-editor > div { display: flex; gap: 8px; }
        .meeting-link-editor input { min-width: 0; flex: 1; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .meeting-link-editor button { display: flex; align-items: center; gap: 5px; padding: 8px 10px; border: 0; border-radius: 8px; background: #2563eb; color: white; font-weight: 700; cursor: pointer; }
        .meeting-link-message { color: #475569; font-size: .78rem; }
        .meet-join-link { display: inline-flex; align-items: center; gap: 5px; color: #2563eb; font-size: .82rem; font-weight: 700; text-decoration: none; }

        /* Doctor Meeting Room Overlay */
        .doc-room-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .doc-room-card { background: white; width: 100%; max-width: 1240px; height: 92vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; }
        .doc-room-header { padding: 16px 24px; border-bottom: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
        .drh-left { display: flex; align-items: center; gap: 16px; }
        .live-pill { display: inline-flex; align-items: center; gap: 6px; background: #fee2e2; color: #dc2626; font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; animation: blink 1.2s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .drh-left h2 { font-size: 1.3rem; margin: 0; }
        .drh-left p { font-size: 0.85rem; color: var(--text-sub); margin: 0; }
        .drh-right { display: flex; align-items: center; gap: 12px; }
        .call-timer { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 0.95rem; background: #f1f5f9; padding: 6px 14px; border-radius: 10px; }
        .btn-room-tool { display: flex; align-items: center; gap: 6px; background: white; border: 1.5px solid #cbd5e1; padding: 6px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; color: #334155; text-decoration: none; }
        .btn-close-room { background: #fee2e2; color: #ef4444; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .doc-room-grid { display: grid; grid-template-columns: 1.25fr 1fr; flex: 1; overflow: hidden; }
        .video-col { display: flex; flex-direction: column; border-right: 1.5px solid #e2e8f0; }
        .video-frame-container { flex: 1.6; background: #000; position: relative; }
        .meet-link-panel { height: 100%; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 30px; text-align: center; color: white; background: linear-gradient(135deg, #0f172a, #1e3a8a); }
        .meet-link-panel h3, .meet-link-panel p { margin: 0; }
        .meet-link-panel p { max-width: 420px; color: #cbd5e1; }
        .meet-link-panel a { display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 10px; background: #2563eb; color: white; font-weight: 800; text-decoration: none; }
        .meet-link-panel > span { color: #cbd5e1; }
        .room-chat-box { flex: 1; display: flex; flex-direction: column; background: #f8fafc; border-top: 1.5px solid #e2e8f0; }
        .chat-header { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 0.82rem; font-weight: 800; color: #475569; display: flex; align-items: center; gap: 6px; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .chat-bubble { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 0.88rem; }
        .chat-bubble.doctor { align-self: flex-end; background: #2563eb; color: white; }
        .chat-bubble.patient { align-self: flex-start; background: #e2e8f0; color: #1e293b; }
        .chat-bubble.system { align-self: center; background: #f1f5f9; color: #64748b; font-size: 0.78rem; font-style: italic; }
        .chat-sender { font-size: 0.7rem; font-weight: 800; opacity: 0.8; display: block; margin-bottom: 2px; }
        .chat-bubble p { margin: 0; }
        .chat-form { display: flex; padding: 8px 12px; gap: 8px; border-top: 1px solid #e2e8f0; background: white; }
        .chat-form input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; }
        .chat-form button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .workspace-col { display: flex; flex-direction: column; overflow: hidden; background: #ffffff; }
        .workspace-tabs { display: flex; border-bottom: 1.5px solid #e2e8f0; background: #f8fafc; }
        .ws-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 700; font-size: 0.9rem; color: #64748b; cursor: pointer; }
        .ws-tab.active { border-bottom-color: #2563eb; color: #2563eb; background: white; }
        .ws-content { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

        .patient-demographics-bar { display: flex; gap: 14px; font-size: 0.82rem; background: #f1f5f9; padding: 10px 14px; border-radius: 10px; }
        .record-panel-card { border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .mri-review-list { display: flex; flex-direction: column; gap: 12px; }
        .mri-review-card { padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .mri-review-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .mri-review-heading > div { display: flex; flex-direction: column; gap: 4px; }
        .mri-review-heading span, .mri-review-card p, .mri-unlinked-note { font-size: .84rem; color: #64748b; margin: 0; }
        .mri-review-status { padding: 4px 8px; border-radius: 12px; background: #fef3c7; color: #92400e !important; text-transform: capitalize; }
        .mri-review-status.approved { background: #dcfce7; color: #166534 !important; }
        .mri-review-status.needs_follow_up { background: #fee2e2; color: #991b1b !important; }
        .mri-review-card > a { display: inline-flex; align-items: center; gap: 4px; color: #2563eb; font-size: .84rem; font-weight: 700; text-decoration: none; }
        .mri-review-actions { display: flex; flex-direction: column; gap: 8px; }
        .mri-review-actions textarea { width: 100%; padding: 9px; border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical; }
        .mri-review-actions > div { display: flex; gap: 8px; }
        .mri-review-actions button { padding: 8px 12px; border: 0; border-radius: 8px; background: #059669; color: white; font-weight: 700; cursor: pointer; }
        .mri-review-actions .follow-up { background: #d97706; }
        .rpc-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .rpc-title h4 { margin: 0; font-size: 0.95rem; }
        .mri-shared-content { display: flex; gap: 16px; }
        .mri-thumb-box { position: relative; width: 100px; height: 100px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .mri-thumb { width: 100%; height: 100%; object-fit: cover; }
        .mri-no-preview { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; padding: 8px; background: #f1f5f9; color: #64748b; font-size: .72rem; text-align: center; }
        .mri-risk-tag { position: absolute; bottom: 0; inset-inline: 0; text-align: center; font-size: 0.65rem; font-weight: 800; padding: 2px; }
        .mri-shared-details p { margin: 2px 0; font-size: 0.85rem; color: #334155; }
        .mri-notes-text { font-size: 0.8rem; color: #64748b; margin-top: 6px !important; }

        .battery-scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .bsc-item { background: #f8fafc; padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 2px; border: 1px solid #e2e8f0; }
        .bsc-item span { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
        .bsc-item strong { font-size: 1.15rem; color: #1e293b; }

        /* Notes Form */
        .notes-form-view { display: flex; flex-direction: column; gap: 14px; }
        .save-success-banner { display: flex; align-items: center; gap: 8px; background: #dcfce7; color: #15803d; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.82rem; font-weight: 800; color: #334155; }
        .form-group textarea { padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.9rem; font-family: inherit; resize: vertical; outline: none; }
        .form-group textarea:focus { border-color: #2563eb; }
        .btn-save-notes { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.25); margin-top: 6px; }

        /* Modal Styles */
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
        .modal-tab { background: none; border: none; border-bottom: 3px solid transparent; padding: 14px 20px; font-size: 0.9rem; font-weight: 700; color: var(--text-sub); cursor: pointer; }
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
        .actions-tab { display: flex; flex-direction: column; gap: 24px; }
        .action-block { background: var(--background); padding: 20px; border-radius: 16px; display: flex; flex-direction: column; gap: 10px; }
        .action-block textarea { padding: 10px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 0.9rem; font-family: inherit; }
        .btn-action { padding: 10px 20px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; align-self: flex-start; }
        .btn-action.green { background: #10b981; color: white; }
        .btn-action.blue { background: var(--primary); color: white; }
        .past-notes { border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .past-note { background: white; border-radius: 8px; padding: 10px; font-size: 0.85rem; }

        @media (max-width: 992px) {
          .consultations-grid { grid-template-columns: 1fr; }
          .doc-room-grid { grid-template-columns: 1fr; height: auto; overflow-y: auto; }
          .video-frame-container { height: 320px; }
        }
      `}</style>
    </div>
  );
};

export default DoctorPortal;
