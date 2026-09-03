import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Activity, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Activity className="text-primary" size={32} />
            <span>CogniFusion</span>
          </Link>
          <h1>Welcome Back</h1>
          <p>Please enter your details to sign in.</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="icon-right" onClick={() => setShowPass(!showPass)}>
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="forgot-pass">
              <Link to="#">Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-primary-lg full-width" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Create account</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; background: #f8fbff; padding: 20px; }
        .auth-card { background: white; padding: 50px; border-radius: var(--border-radius-lg); box-shadow: 0 15px 35px rgba(0,0,0,0.05); width: 100%; max-width: 480px; }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-logo { display: flex; align-items: center; gap: 10px; justify-content: center; text-decoration: none; color: var(--text-primary); font-weight: 800; font-size: 1.5rem; margin-bottom: 25px; }
        .auth-header h1 { font-size: 1.8rem; margin-bottom: 8px; }
        .auth-header p { color: var(--text-secondary); }
        .auth-error { display: flex; align-items: center; gap: 8px; background: #fff1f2; border: 1px solid #fecdd3; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-with-icon svg:first-child { position: absolute; left: 15px; color: var(--text-secondary); pointer-events: none; }
        .icon-right { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; padding: 4px; }
        .input-with-icon input { width: 100%; padding: 14px 44px 14px 45px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box; }
        .input-with-icon input:focus { outline: none; border-color: var(--primary); }
        .forgot-pass { text-align: right; margin-top: 5px; }
        .forgot-pass a { font-size: 0.85rem; color: var(--primary); text-decoration: none; font-weight: 600; }
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: var(--primary); color: white; border: none; border-radius: var(--border-radius-sm); font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .btn-primary-lg:hover:not(:disabled) { background: var(--primary-hover); }
        .btn-primary-lg:disabled { opacity: 0.6; cursor: not-allowed; }
        .full-width { width: 100%; }
        .auth-footer { margin-top: 30px; text-align: center; font-size: 0.95rem; color: var(--text-secondary); }
        .auth-footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Login;
