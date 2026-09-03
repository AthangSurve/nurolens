import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Star, MapPin, Clock, Video, Calendar, CheckCircle2, X, AlertCircle,
  PhoneOff, ExternalLink, Copy, Check, User, Search, Sparkles,
  ChevronRight, RefreshCw, MessageSquare
} from 'lucide-react';
import { doctorService } from '../services/api';

const ConsultDoctor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'consultations' ? 'consultations' : 'directory';

  const [activeTab, setActiveTab]         = useState(initialTab);
  const [doctors, setDoctors]             = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [consultLoading, setConsultLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  // Booking Modal State
  const [booking, setBooking]       = useState(null);
  const [scheduled, setScheduled]   = useState('');
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState('');

  // Active Video Call Room Modal State
  const [activeCall, setActiveCall]     = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [copied, setCopied]             = useState(false);
  const timerRef                        = useRef(null);

  // Load specialists on mount
  useEffect(() => {
    loadDoctors();
    loadConsultations();
  }, []);

  // Timer for active video call
  useEffect(() => {
    if (activeCall) {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getAll();
      setDoctors(res.data.data || []);
    } catch {
      setError('Failed to load specialists. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadConsultations = async () => {
    setConsultLoading(true);
    try {
      const res = await doctorService.getConsultations();
      setConsultations(res.data.data || []);
    } catch {
      // Non-blocking error for consultations
    } finally {
      setConsultLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!scheduled) {
      setError('Please select a date and time for your consultation.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await doctorService.book({
        doctor_id: booking.id,
        scheduled_at: new Date(scheduled).toISOString(),
        notes,
      });
      setSuccess(data.data);
      setBooking(null);
      setNotes('');
      setScheduled('');
      loadConsultations();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please select a different time slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (consultationId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
    try {
      await doctorService.cancelConsultation(consultationId);
      loadConsultations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel consultation.');
    }
  };

  const handleCompleteCall = async () => {
    if (activeCall?.id) {
      try {
        await doctorService.completeConsultation(activeCall.id);
        loadConsultations();
      } catch (_) {}
    }
    setActiveCall(null);
  };

  const copyMeetingLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filter doctors
  const specialties = ['All', ...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpec;
  });

  const upcomingCount = consultations.filter((c) => c.status === 'upcoming').length;

  const RatingStars = ({ rating }) => (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < Math.floor(rating || 5) ? '#F59E0B' : 'none'}
          color="#F59E0B"
        />
      ))}
      <span>{(rating || 5.0).toFixed(1)}</span>
    </div>
  );

  return (
    <div className="consult-v2 container animate-fade-up">
      {/* Header */}
      <div className="hdr">
        <div>
          <div className="telehealth-tag">
            <Sparkles size={14} /> Certified Telehealth Services
          </div>
          <h1>Consulting Specialists</h1>
          <p>
            Connect directly with board-certified neurologists, cognitive experts, and dementia specialists for live video teleconsultations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-switch-bar">
        <button
          className={`tab-switch-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => { setActiveTab('directory'); setSearchParams({ tab: 'directory' }); }}
        >
          <User size={18} />
          <span>Find Specialists</span>
          <span className="tab-pill">{doctors.length}</span>
        </button>
        <button
          className={`tab-switch-btn ${activeTab === 'consultations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('consultations'); setSearchParams({ tab: 'consultations' }); }}
        >
          <Video size={18} />
          <span>My Consultations</span>
          {upcomingCount > 0 && <span className="tab-pill green">{upcomingCount} Upcoming</span>}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-block alert-danger mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {/* Booking Success Banner */}
      {success && (
        <div className="success-banner mb-4">
          <div className="success-icon-wrap">
            <CheckCircle2 size={28} className="text-secondary" />
          </div>
          <div className="success-info">
            <strong>Consultation Confirmed!</strong>
            <p>
              Your teleconsultation session with <strong>{success.doctor}</strong> is scheduled for{' '}
              {new Date(success.scheduled_at).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}.
            </p>
            <div className="success-actions">
              <button
                className="btn-join-call"
                onClick={() => setActiveCall({
                  id: success.consultation_id,
                  doctor: success.doctor,
                  specialty: success.specialty,
                  meeting_url: success.meeting_url,
                  scheduled_at: success.scheduled_at
                })}
              >
                <Video size={16} /> Enter Video Room
              </button>
              <button
                className="btn-link-sec"
                onClick={() => { setActiveTab('consultations'); setSuccess(null); }}
              >
                View in My Consultations →
              </button>
            </div>
          </div>
          <button className="close-btn" onClick={() => setSuccess(null)}><X size={20} /></button>
        </div>
      )}

      {/* ─── TAB 1: Specialist Directory ─── */}
      {activeTab === 'directory' && (
        <>
          {/* Search & Filter Bar */}
          <div className="search-filter-row">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search specialists by name, specialty, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}><X size={14} /></button>
              )}
            </div>

            <div className="filter-chips">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  className={`chip ${selectedSpecialty === spec ? 'active' : ''}`}
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spin-ring" />
              <p>Loading verified specialists...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="empty-state card-modern">
              <User size={48} className="text-muted" />
              <h3>No specialists found</h3>
              <p>Try clearing your search query or selecting a different specialty filter.</p>
              <button className="btn-secondary" onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="doctor-grid">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="card-modern doctor-card-v2">
                  <div className="doc-avatar-wrap">
                    {doc.image_url ? (
                      <img src={doc.image_url} alt={doc.full_name} className="doc-img" />
                    ) : (
                      <div className="doc-avatar">
                        {doc.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <span className="online-indicator" title="Available for booking" />
                  </div>

                  <div className="doc-body">
                    <div className="doc-top-line">
                      <h3>{doc.full_name}</h3>
                      <RatingStars rating={doc.rating || 4.8} />
                    </div>
                    <p className="doc-spec">{doc.specialty}</p>

                    <p className="doc-bio">{doc.bio || 'Specialist in early cognitive health and neurological assessment.'}</p>

                    <div className="doc-meta">
                      <span><MapPin size={13} /> {doc.location || 'Remote / Telehealth'}</span>
                      <span><Clock size={13} /> {doc.experience || '10+'} experience</span>
                    </div>

                    <p className="doc-availability">
                      <CheckCircle2 size={13} color="#10B981" />
                      {doc.availability || 'Available Today'}
                    </p>
                  </div>

                  <div className="doc-actions">
                    <button
                      className="btn-book"
                      onClick={() => { setBooking(doc); setError(''); }}
                    >
                      <Calendar size={16} /> Book Session
                    </button>
                    <button
                      className="btn-quick-call"
                      title="Direct video consultation room"
                      onClick={() => {
                        const roomClean = doc.full_name.replace(/[^a-zA-Z0-9]/g, '');
                        setActiveCall({
                          id: `instant-${doc.id}`,
                          doctor: doc.full_name,
                          specialty: doc.specialty,
                          meeting_url: `https://meet.jit.si/NeuroLens-${roomClean}-${Date.now()}`,
                          scheduled_at: new Date().toISOString(),
                        });
                      }}
                    >
                      <Video size={16} /> Meet Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: My Consultations ─── */}
      {activeTab === 'consultations' && (
        <div className="consultations-tab-content">
          <div className="tab-header-row">
            <div>
              <h2>Scheduled Telehealth Sessions</h2>
              <p>Manage and join your upcoming video appointments with specialists.</p>
            </div>
            <button className="btn-refresh" onClick={loadConsultations} disabled={consultLoading}>
              <RefreshCw size={16} className={consultLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {consultLoading ? (
            <div className="loading-state">
              <div className="spin-ring" />
              <p>Fetching your appointments...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="empty-state card-modern">
              <Calendar size={48} className="text-muted" />
              <h3>No consultations scheduled</h3>
              <p>You haven't booked any specialist consultations yet. Select a doctor to schedule your first session.</p>
              <button className="btn-book" onClick={() => setActiveTab('directory')}>
                <User size={16} /> Browse Specialists
              </button>
            </div>
          ) : (
            <div className="consultations-list">
              {consultations.map((c) => {
                const doc = c.doctors || {};
                const isUpcoming = c.status === 'upcoming';
                const isCompleted = c.status === 'completed';

                return (
                  <div key={c.id} className={`card-modern consultation-card ${c.status}`}>
                    <div className="c-card-left">
                      <div className="c-doc-avatar">
                        {doc.image_url ? (
                          <img src={doc.image_url} alt={doc.full_name} className="doc-img" />
                        ) : (
                          <div className="doc-avatar">
                            {(doc.full_name || 'Dr').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="c-details">
                        <div className="c-header-row">
                          <h3>{doc.full_name || 'Specialist Consultation'}</h3>
                          <span className={`status-pill ${c.status}`}>
                            {isUpcoming && '● Upcoming'}
                            {isCompleted && '✓ Completed'}
                            {c.status === 'cancelled' && '✕ Cancelled'}
                          </span>
                        </div>
                        <p className="c-spec">{doc.specialty || 'Cognitive Neurologist'}</p>

                        <div className="c-time-info">
                          <span className="time-badge">
                            <Calendar size={14} />
                            {new Date(c.scheduled_at).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                          <span className="time-badge">
                            <Clock size={14} />
                            {new Date(c.scheduled_at).toLocaleTimeString('en-US', {
                              hour: 'numeric', minute: '2-digit'
                            })} ({c.duration_mins || 30} mins)
                          </span>
                        </div>

                        {c.notes && (
                          <div className="c-notes">
                            <MessageSquare size={13} />
                            <span><strong>Patient Concern:</strong> {c.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="c-card-right">
                      {isUpcoming && (
                        <>
                          <button
                            className="btn-join-call"
                            onClick={() => setActiveCall({
                              id: c.id,
                              doctor: doc.full_name || 'Specialist',
                              specialty: doc.specialty || 'Telehealth',
                              meeting_url: c.meeting_url || `https://meet.jit.si/NeuroLens-Session-${c.id}`,
                              scheduled_at: c.scheduled_at,
                              notes: c.notes,
                            })}
                          >
                            <Video size={16} /> Join Video Call
                          </button>

                          <div className="c-sub-actions">
                            <button
                              className="btn-icon-sub"
                              title="Copy Meeting Link"
                              onClick={() => copyMeetingLink(c.meeting_url || `https://meet.jit.si/NeuroLens-Session-${c.id}`)}
                            >
                              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />} Link
                            </button>
                            <a
                              href={c.meeting_url || `https://meet.jit.si/NeuroLens-Session-${c.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-icon-sub"
                              title="Open in Standalone Tab"
                            >
                              <ExternalLink size={14} /> Tab
                            </a>
                            <button
                              className="btn-cancel-appt"
                              onClick={() => handleCancel(c.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}

                      {isCompleted && (
                        <div className="completed-info">
                          <span className="completed-tag">Session Completed</span>
                          <button
                            className="btn-book-sm"
                            onClick={() => { setBooking(doc); setActiveTab('directory'); }}
                          >
                            Book Follow-up
                          </button>
                        </div>
                      )}

                      {c.status === 'cancelled' && (
                        <span className="cancelled-text">Session Cancelled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: Booking Modal ─── */}
      {booking && (
        <div className="modal-overlay" onClick={() => setBooking(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setBooking(null)}><X size={22} /></button>
            <div className="modal-header">
              <div className="modal-avatar">
                {booking.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h2>Book Teleconsultation</h2>
                <p>with {booking.full_name} · {booking.specialty}</p>
              </div>
            </div>

            {error && (
              <div className="alert-block alert-danger mb-4">
                <AlertCircle size={16} /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="booking-form">
              <div className="quick-times-row">
                <span className="quick-label">Quick slots:</span>
                <button
                  type="button"
                  className="time-chip"
                  onClick={() => {
                    const d = new Date(Date.now() + 3600000);
                    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
                    setScheduled(d.toISOString().slice(0, 16));
                  }}
                >
                  In 1 Hour
                </button>
                <button
                  type="button"
                  className="time-chip"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(10, 0, 0, 0);
                    setScheduled(d.toISOString().slice(0, 16));
                  }}
                >
                  Tomorrow 10 AM
                </button>
                <button
                  type="button"
                  className="time-chip"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(15, 30, 0, 0);
                    setScheduled(d.toISOString().slice(0, 16));
                  }}
                >
                  Tomorrow 3:30 PM
                </button>
              </div>

              <label>Select Date & Time *</label>
              <input
                type="datetime-local"
                min={new Date(Date.now() + 300000).toISOString().slice(0, 16)}
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
                required
              />

              <label>Medical Concerns & Symptoms (Optional)</label>
              <textarea
                placeholder="Mention any memory symptoms, test scores, or topics you want to discuss with the doctor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />

              <div className="telehealth-notice">
                <Video size={16} className="text-primary" />
                <span>Includes 30-minute private HD video room with encrypted end-to-end connection.</span>
              </div>

              <button type="submit" className="btn-submit-booking" disabled={submitting}>
                <Video size={18} />
                {submitting ? 'Confirming Appointment...' : 'Confirm & Generate Video Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Full In-App Teleconsultation Video Room ─── */}
      {activeCall && (
        <div className="video-room-overlay">
          <div className="video-room-container">
            {/* Top Control Bar */}
            <div className="video-room-header">
              <div className="room-doc-info">
                <span className="live-pill">
                  <span className="live-dot" /> LIVE TELECONSULT
                </span>
                <div className="room-titles">
                  <h2>{activeCall.doctor}</h2>
                  <p>{activeCall.specialty} · NeuroLens Secure Session</p>
                </div>
              </div>

              <div className="room-timer-badge">
                <Clock size={16} />
                <span>{formatTimer(callDuration)}</span>
              </div>

              <div className="room-top-actions">
                <button
                  className="btn-room-action"
                  title="Copy Direct Video Link"
                  onClick={() => copyMeetingLink(activeCall.meeting_url)}
                >
                  {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                  <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
                </button>

                <a
                  href={activeCall.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-room-action"
                  title="Open in new browser tab"
                >
                  <ExternalLink size={16} />
                  <span>Full Window</span>
                </a>

                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-room-action google"
                  title="Switch to Google Meet if preferred"
                >
                  Google Meet
                </a>

                <button
                  className="btn-room-close"
                  onClick={() => setActiveCall(null)}
                  title="Minimize Video Room"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Video Feed (Embedded Jitsi Meet) */}
            <div className="video-frame-wrap">
              <iframe
                src={`${activeCall.meeting_url}#config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`}
                title="NeuroLens Specialist Teleconsultation"
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="teleconsult-iframe"
              />
            </div>

            {/* Bottom Bar Controls */}
            <div className="video-room-footer">
              <div className="footer-left">
                {activeCall.notes ? (
                  <span className="notes-preview">
                    <strong>Patient Note:</strong> {activeCall.notes}
                  </span>
                ) : (
                  <span className="notes-preview">
                    Encrypted WebRTC audio & video streaming active.
                  </span>
                )}
              </div>

              <div className="footer-actions">
                <button
                  className="btn-leave-call"
                  onClick={() => setActiveCall(null)}
                >
                  Leave Call
                </button>

                <button
                  className="btn-complete-call"
                  onClick={handleCompleteCall}
                >
                  <PhoneOff size={16} /> Complete Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Styles */}
      <style>{`
        .consult-v2 { padding: 40px 0 80px; }
        .hdr { margin-bottom: 24px; }
        .telehealth-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: var(--primary);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 12px;
          border: 1px solid #dbeafe;
        }
        .hdr h1 { font-size: 2.2rem; margin-bottom: 8px; color: var(--text-main); }
        .hdr p { color: var(--text-sub); font-size: 1.05rem; max-width: 720px; }

        /* Tabs */
        .tab-switch-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .tab-switch-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-sub);
          cursor: pointer;
          border-radius: 12px;
          transition: var(--transition);
        }
        .tab-switch-btn:hover { background: #f1f5f9; color: var(--text-main); }
        .tab-switch-btn.active {
          background: #e0f2fe;
          color: #0284c7;
        }
        .tab-pill {
          background: #e2e8f0;
          color: #475569;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 800;
        }
        .tab-pill.green {
          background: #dcfce7;
          color: #16a34a;
        }

        /* Search & Filters */
        .search-filter-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }
        .search-input-wrap input {
          width: 100%;
          padding: 14px 44px 14px 46px;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          font-size: 1rem;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: var(--transition);
        }
        .search-input-wrap input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
        }
        .clear-search {
          position: absolute;
          right: 14px;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          padding: 8px 16px;
          border-radius: 20px;
          background: white;
          border: 1px solid #cbd5e1;
          color: var(--text-sub);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .chip:hover { border-color: var(--primary); color: var(--primary); }
        .chip.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.25);
        }

        /* Success & Alert */
        .alert-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          position: relative;
        }
        .alert-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .alert-close { position: absolute; right: 14px; background: none; border: none; cursor: pointer; color: inherit; }

        .success-banner {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 18px;
          padding: 22px 26px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          position: relative;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.08);
        }
        .success-info { flex: 1; }
        .success-info strong { font-size: 1.15rem; color: #15803d; display: block; margin-bottom: 4px; }
        .success-info p { color: #374151; font-size: 0.95rem; margin-bottom: 14px; }
        .success-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .btn-join-call {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-join-call:hover { background: #15803d; transform: translateY(-1px); }
        .btn-link-sec {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; color: #9ca3af; }

        /* Doctor Grid */
        .doctor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        .doctor-card-v2 {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          border-radius: 20px;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          transition: var(--transition);
        }
        .doctor-card-v2:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: #cbd5e1;
        }
        .doc-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
        }
        .doc-img {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          object-fit: cover;
          border: 2px solid #e0f2fe;
        }
        .doc-avatar {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: var(--grad-primary);
          color: white;
          font-size: 1.3rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid white;
        }
        .doc-top-line {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2px;
        }
        .doc-body h3 { font-size: 1.25rem; color: var(--text-main); }
        .doc-spec {
          color: var(--primary);
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .doc-bio {
          color: var(--text-sub);
          font-size: 0.88rem;
          line-height: 1.5;
          margin-bottom: 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .stars {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .stars span {
          margin-left: 5px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .doc-meta {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .doc-meta span {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          color: var(--text-sub);
          font-weight: 600;
        }
        .doc-availability {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #059669;
          font-weight: 700;
        }
        .doc-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .btn-book {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .btn-book:hover { background: var(--primary-hover); transform: translateY(-1px); }
        .btn-quick-call {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .btn-quick-call:hover { background: #dcfce7; }

        /* Consultations Tab */
        .tab-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .tab-header-row h2 { font-size: 1.4rem; }
        .tab-header-row p { color: var(--text-sub); font-size: 0.9rem; }
        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #cbd5e1;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .consultations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .consultation-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-radius: 20px;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          gap: 20px;
        }
        .consultation-card.upcoming { border-left: 5px solid #10B981; }
        .consultation-card.completed { opacity: 0.85; border-left: 5px solid #64748b; }
        .consultation-card.cancelled { opacity: 0.7; border-left: 5px solid #ef4444; }

        .c-card-left {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          flex: 1;
        }
        .c-doc-avatar {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }
        .c-details { flex: 1; }
        .c-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .c-header-row h3 { font-size: 1.2rem; }
        .status-pill {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .status-pill.upcoming { background: #dcfce7; color: #15803d; }
        .status-pill.completed { background: #f1f5f9; color: #475569; }
        .status-pill.cancelled { background: #fee2e2; color: #b91c1c; }

        .c-spec { color: var(--primary); font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; }
        .c-time-info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .time-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.82rem;
          color: var(--text-main);
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        .c-notes {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--text-sub);
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 10px;
          margin-top: 6px;
        }
        .c-card-right {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
          flex-shrink: 0;
        }
        .c-sub-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-icon-sub {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-sub);
          cursor: pointer;
          text-decoration: none;
        }
        .btn-cancel-appt {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          padding: 6px 8px;
        }
        .completed-tag {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 700;
        }
        .btn-book-sm {
          padding: 8px 14px;
          background: var(--surface-alt);
          color: var(--primary);
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }

        /* Loading & Empty states */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--primary);
          font-weight: 600;
        }
        .spin-ring {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin .8s linear infinite;
          margin: 0 auto 16px;
        }
        .spin { animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-state h3 { font-size: 1.3rem; }
        .empty-state p { color: var(--text-sub); max-width: 440px; margin-bottom: 8px; }

        /* Booking Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: white;
          border-radius: 24px;
          padding: 36px;
          width: 100%;
          max-width: 520px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-sub);
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .modal-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--grad-primary);
          color: white;
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-header h2 { font-size: 1.35rem; margin-bottom: 4px; }
        .modal-header p { color: var(--text-sub); font-size: 0.9rem; font-weight: 600; }

        .booking-form { display: flex; flex-direction: column; gap: 14px; }
        .quick-times-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .quick-label { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); }
        .time-chip {
          padding: 6px 12px;
          border-radius: 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284c7;
          cursor: pointer;
        }
        .time-chip:hover { background: #e0f2fe; }

        .booking-form label { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
        .booking-form input, .booking-form textarea {
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 0.95rem;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .booking-form input:focus, .booking-form textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
        }
        .telehealth-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          color: #1e40af;
          font-weight: 500;
        }
        .btn-submit-booking {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px;
          background: var(--grad-primary);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          transition: var(--transition);
        }
        .btn-submit-booking:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(74, 144, 226, 0.3); }
        .btn-submit-booking:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─── In-App Video Room Overlay ─── */
        .video-room-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.95);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(8px);
        }
        .video-room-container {
          width: 100%;
          max-width: 1200px;
          height: 90vh;
          background: #0f172a;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .video-room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #1e293b;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .room-doc-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          letter-spacing: 0.05em;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }
        .room-titles h2 { font-size: 1.15rem; color: white; margin: 0; }
        .room-titles p { font-size: 0.8rem; color: #94a3b8; margin: 0; }
        .room-timer-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: monospace;
          font-size: 1rem;
          font-weight: 700;
        }
        .room-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-room-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: var(--transition);
        }
        .btn-room-action:hover { background: rgba(255,255,255,0.15); color: white; }
        .btn-room-action.google {
          background: #1a73e8;
          border-color: #1a73e8;
          color: white;
        }
        .btn-room-close {
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
        }
        .btn-room-close:hover { color: white; background: rgba(255,255,255,0.2); }

        .video-frame-wrap {
          flex: 1;
          background: #000;
          position: relative;
        }
        .teleconsult-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .video-room-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          background: #1e293b;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .notes-preview {
          font-size: 0.85rem;
          color: #94a3b8;
        }
        .notes-preview strong { color: #e2e8f0; }
        .footer-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .btn-leave-call {
          padding: 10px 18px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 10px;
          color: #cbd5e1;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-complete-call {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-complete-call:hover { background: #dc2626; }

        @media (max-width: 860px) {
          .consultation-card { flex-direction: column; align-items: stretch; }
          .c-card-right { align-items: stretch; }
          .video-room-container { height: 98vh; }
          .room-top-actions span { display: none; }
          .doctor-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ConsultDoctor;
