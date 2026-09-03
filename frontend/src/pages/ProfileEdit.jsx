import React, { useState } from 'react';
import { User, Calendar, GraduationCap, CheckCircle2, AlertCircle, Save, ChevronLeft, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const EDUCATION_OPTIONS = [
  { value: 'No Formal Education',  label: 'No Formal Education',  years: '0 yrs' },
  { value: 'Primary School',       label: 'Primary School',       years: '6 yrs' },
  { value: 'Middle School',        label: 'Middle School',        years: '8 yrs' },
  { value: 'High School',          label: 'High School',          years: '12 yrs' },
  { value: 'Some College',         label: 'Some College',         years: '14 yrs' },
  { value: 'Bachelors Degree',     label: "Bachelor's Degree",    years: '16 yrs' },
  { value: 'Masters Degree',       label: "Master's Degree",      years: '18 yrs' },
  { value: 'Doctoral Degree',      label: 'Doctoral / PhD',       years: '21 yrs' },
];

const GENDER_OPTIONS = [
  { value: 'Male',   label: '♂ Male'   },
  { value: 'Female', label: '♀ Female' },
  { value: 'Other',  label: '⚧ Other'  },
];

const ProfileEdit = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name:                user?.full_name || '',
    date_of_birth:            user?.date_of_birth?.split('T')[0] || '',
    gender:                   user?.gender || '',
    educational_qualification: user?.educational_qualification || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const { data } = await authService.updateProfile(form);
      if (setUser) setUser(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page container animate-fade-up">
      {/* Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Back
        </button>
        <div className="header-title">
          <div className="header-icon"><Edit3 size={26} /></div>
          <div>
            <h1>Edit Profile</h1>
            <p>Update your personal and demographic information used for cognitive scoring</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Avatar Panel */}
        <div className="avatar-panel card-modern">
          <div className="big-avatar">
            {form.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CF'}
          </div>
          <h3>{form.full_name || 'Your Name'}</h3>
          <span className="patient-id-badge">{user?.patient_id || '---'}</span>
          <div className="avatar-meta">
            <div className="meta-row"><User size={15} /> {form.gender || 'Gender not set'}</div>
            <div className="meta-row"><Calendar size={15} /> {form.date_of_birth || 'DOB not set'}</div>
            <div className="meta-row"><GraduationCap size={15} /> {form.educational_qualification || 'Education not set'}</div>
          </div>
          <div className="demo-note">
            <strong>Why does this matter?</strong>
            <p>Your age, gender and education level are used to compare your cognitive test results against the appropriate normative population — ensuring your risk classification is accurate for <em>you</em>.</p>
          </div>
        </div>

        {/* Edit Form */}
        <form className="edit-form card-modern" onSubmit={handleSave}>
          <h2><Edit3 size={20} /> Personal Information</h2>

          {error   && <div className="form-alert alert-danger"><AlertCircle size={18} />{error}</div>}
          {success && <div className="form-alert alert-success"><CheckCircle2 size={18} />Profile updated successfully!</div>}

          {/* Full Name */}
          <div className="field-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <User size={18} className="input-icon" />
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="field-group">
            <label>Date of Birth</label>
            <div className="input-wrap">
              <Calendar size={18} className="input-icon" />
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="field-group">
            <label>Sex / Gender</label>
            <div className="chips-row">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value} type="button"
                  className={`chip ${form.gender === g.value ? 'chip-active' : ''}`}
                  onClick={() => handleChange('gender', g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="field-group">
            <label>Highest Educational Qualification</label>
            <div className="edu-grid">
              {EDUCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value} type="button"
                  className={`edu-chip ${form.educational_qualification === opt.value ? 'edu-active' : ''}`}
                  onClick={() => handleChange('educational_qualification', opt.value)}
                >
                  <span className="edu-label">{opt.label}</span>
                  <span className="edu-years">{opt.years}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>

      <style>{`
        .profile-page { padding: 40px 0; max-width: 1000px; }
        .profile-header { margin-bottom: 40px; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--text-sub); font-weight: 700; cursor: pointer; font-size: 0.95rem; margin-bottom: 24px; }
        .back-btn:hover { color: var(--primary); }
        .header-title { display: flex; align-items: center; gap: 20px; }
        .header-icon { width: 56px; height: 56px; background: var(--grad-primary); color: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .header-title h1 { font-size: 2rem; margin-bottom: 6px; }
        .header-title p { color: var(--text-sub); max-width: 500px; }
        .profile-grid { display: grid; grid-template-columns: 300px 1fr; gap: 32px; }
        .avatar-panel { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 28px; text-align: center; }
        .big-avatar { width: 96px; height: 96px; background: var(--grad-primary); color: white; border-radius: 24px; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .avatar-panel h3 { font-size: 1.25rem; }
        .patient-id-badge { background: #f0f7ff; color: var(--primary); font-size: 0.78rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; }
        .avatar-meta { width: 100%; display: flex; flex-direction: column; gap: 10px; margin: 8px 0; }
        .meta-row { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-sub); font-weight: 500; }
        .demo-note { background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; text-align: left; }
        .demo-note strong { font-size: 0.85rem; color: #065f46; display: block; margin-bottom: 6px; }
        .demo-note p { font-size: 0.82rem; color: #047857; line-height: 1.5; margin: 0; }
        .edit-form { padding: 40px; display: flex; flex-direction: column; gap: 28px; }
        .edit-form h2 { display: flex; align-items: center; gap: 10px; font-size: 1.3rem; margin-bottom: 4px; }
        .form-alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; }
        .alert-danger { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        .alert-success { background: #f0fdf4; color: #065f46; border: 1px solid #a7f3d0; }
        .field-group { display: flex; flex-direction: column; gap: 8px; }
        .field-group label { font-size: 0.88rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.04em; }
        .input-wrap { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .input-wrap input { width: 100%; padding: 12px 16px 12px 44px; border: 1.5px solid var(--border-color, #e2e8f0); border-radius: 10px; font-size: 1rem; box-sizing: border-box; transition: border-color 0.2s; }
        .input-wrap input:focus { outline: none; border-color: var(--primary); }
        .chips-row { display: flex; gap: 10px; }
        .chip { padding: 10px 22px; border: 1.5px solid var(--border-color, #e2e8f0); border-radius: 10px; font-size: 0.95rem; font-weight: 600; background: white; cursor: pointer; transition: all 0.2s; }
        .chip:hover { border-color: var(--primary); color: var(--primary); }
        .chip-active { background: var(--primary); color: white; border-color: var(--primary); }
        .edu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .edu-chip { display: flex; flex-direction: column; align-items: flex-start; padding: 12px 16px; border: 1.5px solid var(--border-color, #e2e8f0); border-radius: 10px; background: white; cursor: pointer; transition: all 0.2s; }
        .edu-chip:hover { border-color: var(--primary); }
        .edu-active { background: var(--primary) !important; border-color: var(--primary) !important; }
        .edu-active .edu-label, .edu-active .edu-years { color: white !important; }
        .edu-label { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
        .edu-years { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .btn-save { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; background: var(--grad-primary); color: white; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 700; cursor: pointer; margin-top: auto; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default ProfileEdit;
