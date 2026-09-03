import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Shield, ArrowRight, Activity, AlertCircle,
  Calendar, GraduationCap, ChevronRight, Check, Heart, Brain,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const EDUCATION_OPTIONS = [
  { value: 'No Formal Education', label: 'No Formal Education',   years: '0 years' },
  { value: 'Primary School',       label: 'Primary School',        years: '~6 years' },
  { value: 'High School',          label: 'High School / GED',     years: '~12 years' },
  { value: 'Some College',         label: 'Some College / Diploma', years: '~14 years' },
  { value: 'Bachelors Degree',     label: "Bachelor's Degree",     years: '~16 years' },
  { value: 'Masters Degree',       label: "Master's Degree",       years: '~18 years' },
  { value: 'Doctoral Degree',      label: 'Doctoral / PhD',        years: '21+ years' },
];

const GENDER_OPTIONS = [
  { value: 'Male',   label: 'Male',   icon: '♂' },
  { value: 'Female', label: 'Female', icon: '♀' },
  { value: 'Other',  label: 'Other',  icon: '⚧' },
];

// ─── Step Indicator Component ─────────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="step-indicator">
    {[1, 2].map((s) => (
      <React.Fragment key={s}>
        <div className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
          {step > s ? <Check size={12} /> : s}
        </div>
        {s < 2 && <div className={`step-line ${step > s ? 'done' : ''}`} />}
      </React.Fragment>
    ))}
    <style>{`
      .step-indicator { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 32px; }
      .step-dot {
        width: 32px; height: 32px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.8rem; font-weight: 700;
        background: #e2e8f0; color: #94a3b8;
        transition: all 0.3s ease;
      }
      .step-dot.active { background: var(--primary); color: white; box-shadow: 0 0 0 4px rgba(74,144,226,0.2); }
      .step-dot.done   { background: #10b981; color: white; }
      .step-line { width: 60px; height: 3px; background: #e2e8f0; transition: background 0.3s ease; }
      .step-line.done  { background: #10b981; }
    `}</style>
  </div>
);

// ─── Main Signup Component ────────────────────────────────────────────────────
const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({
    full_name: '', email: '', password: '',
    date_of_birth: '', gender: '', educational_qualification: '',
    role: 'patient', doctor_secret_code: '',
  });

  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setField     = (name, value) => setForm({ ...form, [name]: value });

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.email.trim())     { setError('Please enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setStep(2);
  };

  // ── Step 2 final submission ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('Please accept the Terms of Service to continue.'); return; }
    if (!form.gender) { setError('Please select your sex/gender.'); return; }
    if (!form.educational_qualification) { setError('Please select your educational qualification.'); return; }

    setLoading(true);
    try {
      await signup(form);
      navigate(form.role === 'doctor' ? '/doctor-portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Activity className="text-primary" size={32} />
            <span>CogniFusion</span>
          </Link>
          <h1>{step === 1 ? 'Create Your Account' : 'Patient Profile'}</h1>
          <p>
            {step === 1
              ? 'Join CogniFusion for AI-powered cognitive health screening.'
              : 'Help us personalise your cognitive assessment norms.'}
          </p>
        </div>

        <StepIndicator step={step} />

        {/* Error Banner */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: Account Credentials ── */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleStep1}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="text" name="full_name" placeholder="John Doe"
                  value={form.full_name} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email" name="email" placeholder="name@example.com"
                  value={form.email} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Create Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type="password" name="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-lg full-width">
              Continue <ChevronRight size={20} />
            </button>
          </form>
        )}

        {/* ── STEP 2: Patient Demographics ── */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Why we ask banner */}
            <div className="info-banner">
              <Brain size={18} />
              <div>
                <strong>Why we ask this</strong>
                <p>Age, sex, and education level affect cognitive test norms. We use this to compare your results against the right reference population — giving you a more accurate, personalised risk assessment.</p>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label>Date of Birth <span className="optional-tag">Required for age norms</span></label>
              <div className="input-with-icon">
                <Calendar size={18} />
                <input
                  type="date" name="date_of_birth"
                  value={form.date_of_birth} onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Gender / Sex */}
            <div className="form-group">
              <label>Sex / Gender <span className="required-star">*</span></label>
              <div className="gender-grid">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`gender-btn ${form.gender === g.value ? 'selected' : ''}`}
                    onClick={() => setField('gender', g.value)}
                  >
                    <span className="gender-icon">{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Educational Qualification */}
            <div className="form-group">
              <label>
                <GraduationCap size={16} style={{ display: 'inline', marginRight: 6 }} />
                Highest Educational Qualification <span className="required-star">*</span>
              </label>
              <p className="field-hint">Used for demographically-adjusted cognitive scoring</p>
              <div className="edu-grid">
                {EDUCATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`edu-btn ${form.educational_qualification === opt.value ? 'selected' : ''}`}
                    onClick={() => setField('educational_qualification', opt.value)}
                  >
                    <span className="edu-label">{opt.label}</span>
                    <span className="edu-years">{opt.years}</span>
                    {form.educational_qualification === opt.value && (
                      <span className="edu-check"><Check size={14} /></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Role */}
            <div className="form-group">
              <label>Account Type</label>
              <div className="gender-grid">
                <button type="button" className={`gender-btn ${form.role === 'patient' ? 'selected' : ''}`} onClick={() => setField('role', 'patient')}>
                  <span className="gender-icon">🧑</span><span>Patient</span>
                </button>
                <button type="button" className={`gender-btn ${form.role === 'doctor' ? 'selected' : ''}`} onClick={() => setField('role', 'doctor')}>
                  <span className="gender-icon">👨‍⚕️</span><span>Doctor</span>
                </button>
              </div>
            </div>

            {/* Doctor Secret Code (only shown if role = doctor) */}
            {form.role === 'doctor' && (
              <div className="form-group">
                <label>Doctor Registration Code <span className="required-star">*</span></label>
                <p className="field-hint">Provided by your hospital administrator</p>
                <div className="input-with-icon">
                  <Shield size={18} />
                  <input
                    type="password"
                    name="doctor_secret_code"
                    placeholder="Enter doctor registration code"
                    value={form.doctor_secret_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Terms */}

            <div className="terms-agreement">
              <label className="checkbox-container">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="text">
                  I agree to the <Link to="#">Terms of Service</Link> and <Link to="#">Privacy Policy</Link> for medical data.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn-back"
                onClick={() => { setStep(1); setError(''); }}
              >
                ← Back
              </button>
              <button type="submit" className="btn-primary-lg" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Signup'}{!loading && <ArrowRight size={20} />}
              </button>
            </div>
          </form>
        )}

        <div className="security-note">
          <Shield size={16} />
          <span>HIPAA compliant. Your medical data is encrypted and never sold.</span>
        </div>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <style>{`
        .auth-page { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f4ff 0%, #f8fbff 100%); padding: 40px 20px; }
        .auth-card { background: white; padding: 50px; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(74,144,226,0.06); width: 100%; max-width: 580px; }
        .auth-header { text-align: center; margin-bottom: 24px; }
        .auth-logo { display: flex; align-items: center; gap: 10px; justify-content: center; text-decoration: none; color: var(--text-primary); font-weight: 800; font-size: 1.5rem; margin-bottom: 20px; }
        .auth-header h1 { font-size: 1.8rem; margin-bottom: 8px; }
        .auth-header p { color: var(--text-secondary); font-size: 0.95rem; }
        .auth-error { display: flex; align-items: center; gap: 8px; background: #fff1f2; border: 1px solid #fecdd3; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px; }
        .optional-tag { font-size: 0.75rem; font-weight: 500; background: #eff6ff; color: #3b82f6; padding: 2px 8px; border-radius: 20px; margin-left: 6px; }
        .required-star { color: #ef4444; }
        .field-hint { font-size: 0.8rem; color: var(--text-secondary, #64748b); margin: -4px 0 4px; font-weight: 400; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon svg { position: absolute; left: 15px; color: var(--text-secondary); pointer-events: none; }
        .input-with-icon input { width: 100%; padding: 14px 15px 14px 45px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; background: #f8faff; }
        .input-with-icon input:focus { outline: none; border-color: var(--primary, #4a90e2); box-shadow: 0 0 0 3px rgba(74,144,226,0.15); background: white; }

        /* Gender Selector */
        .gender-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .gender-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 10px; border: 1.5px solid #e2e8f0; border-radius: 12px; background: #f8faff; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; font-weight: 600; color: #475569; }
        .gender-btn:hover { border-color: var(--primary, #4a90e2); background: #eff6ff; }
        .gender-btn.selected { border-color: var(--primary, #4a90e2); background: linear-gradient(135deg, #eff6ff, #dbeafe); color: var(--primary, #4a90e2); box-shadow: 0 2px 8px rgba(74,144,226,0.2); }
        .gender-icon { font-size: 1.4rem; }

        /* Education Selector */
        .edu-grid { display: flex; flex-direction: column; gap: 8px; }
        .edu-btn { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; background: #f8faff; cursor: pointer; transition: all 0.2s; text-align: left; position: relative; }
        .edu-btn:hover { border-color: var(--primary, #4a90e2); background: #eff6ff; }
        .edu-btn.selected { border-color: var(--primary, #4a90e2); background: linear-gradient(135deg, #eff6ff, #dbeafe); box-shadow: 0 2px 8px rgba(74,144,226,0.15); }
        .edu-label { font-size: 0.9rem; font-weight: 600; color: #334155; flex: 1; }
        .edu-btn.selected .edu-label { color: var(--primary, #4a90e2); }
        .edu-years { font-size: 0.78rem; color: #94a3b8; font-weight: 500; white-space: nowrap; }
        .edu-check { color: var(--primary, #4a90e2); display: flex; align-items: center; }

        /* Info Banner */
        .info-banner { display: flex; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, #eff6ff, #f0fdf4); border: 1px solid #bfdbfe; border-radius: 12px; font-size: 0.85rem; color: #1e40af; align-items: flex-start; }
        .info-banner svg { flex-shrink: 0; margin-top: 2px; }
        .info-banner strong { display: block; font-weight: 700; margin-bottom: 4px; }
        .info-banner p { margin: 0; color: #3730a3; opacity: 0.85; line-height: 1.5; }

        /* Buttons */
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px 24px; background: linear-gradient(135deg, var(--primary, #4a90e2), #7c3aed); color: white; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(74,144,226,0.3); }
        .btn-primary-lg:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,144,226,0.4); }
        .btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .full-width { width: 100%; }
        .btn-back { padding: 15px 20px; background: transparent; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-back:hover { background: #f8faff; border-color: #94a3b8; }

        /* Terms */
        .terms-agreement { margin: 0; }
        .checkbox-container { display: flex; gap: 10px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; align-items: flex-start; }
        .checkbox-container input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; width: 16px; height: 16px; accent-color: var(--primary, #4a90e2); }
        .checkbox-container a { color: var(--primary, #4a90e2); text-decoration: none; font-weight: 600; }

        .security-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 24px; font-size: 0.8rem; color: var(--text-secondary); }
        .auth-footer { margin-top: 16px; text-align: center; font-size: 0.95rem; color: var(--text-secondary); }
        .auth-footer a { color: var(--primary, #4a90e2); text-decoration: none; font-weight: 600; }

        @media (max-width: 520px) {
          .auth-card { padding: 30px 20px; }
          .gender-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Signup;
