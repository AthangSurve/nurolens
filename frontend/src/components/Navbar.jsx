import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const isAuthPage    = ['/login', '/signup'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get initials for avatar
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CF';

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <nav className={`nav-v2 ${!isLandingPage ? 'nav-clinical' : ''}`}>
      <div className="container nav-content-v2">
        <div className="nav-left">
          {isLandingPage ? (
            <Link to="/" className="brand-v2">
              <Activity className="brand-icon" size={28} strokeWidth={3} />
              <span>CogniFusion</span>
            </Link>
          ) : (
            <div className="search-pill">
              <Search size={18} className="text-muted" />
              <input type="text" placeholder="Search tests, doctors, or reports..." />
            </div>
          )}
        </div>

        {isLandingPage && (
          <div className="nav-center">
            <Link to="/" className="nav-link-v2 active">Features</Link>
            <Link to="/" className="nav-link-v2">Research</Link>
            <Link to="/" className="nav-link-v2">Partners</Link>
            <Link to="/" className="nav-link-v2">Pricing</Link>
          </div>
        )}

        <div className="nav-right">
          {isLandingPage ? (
            <>
              <Link to="/login" className="btn-v2-text">Log In</Link>
              <Link to="/signup" className="btn-v2-primary">Get Started</Link>
            </>
          ) : user ? (
            <>
              <button className="icon-btn-v2"><Bell size={20} /></button>
              <div className="user-badge-v2">
                <div className="badge-text">
                  <strong>{firstName}</strong>
                  <span>Patient</span>
                </div>
                <div className="avatar-circle">{initials}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-v2-primary">Sign In</Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .nav-v2 { height: 80px; display: flex; align-items: center; background: transparent; position: sticky; top: 0; z-index: 100; transition: var(--transition); }
        .nav-clinical { background: white; height: 70px; border-bottom: 1px solid var(--surface-alt); }
        .nav-content-v2 { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .brand-v2 { text-decoration: none; display: flex; align-items: center; gap: 12px; color: var(--text-main); font-weight: 800; font-size: 1.4rem; }
        .brand-icon { color: var(--primary); }
        .search-pill { background: var(--background); padding: 8px 16px; border-radius: 30px; display: flex; align-items: center; gap: 12px; width: 340px; border: 1px solid var(--surface-alt); }
        .search-pill input { border: none; background: none; outline: none; width: 100%; font-size: 0.9rem; font-weight: 500; }
        .nav-center { display: flex; gap: 32px; }
        .nav-link-v2 { text-decoration: none; color: var(--text-sub); font-weight: 600; font-size: 0.95rem; transition: var(--transition); }
        .nav-link-v2:hover, .nav-link-v2.active { color: var(--primary); }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .btn-v2-text { text-decoration: none; color: var(--text-main); font-weight: 700; font-size: 0.95rem; }
        .btn-v2-primary { text-decoration: none; background: var(--grad-primary); color: white; padding: 10px 24px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2); }
        .icon-btn-v2 { width: 40px; height: 40px; border-radius: 12px; border: none; background: var(--background); color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .user-badge-v2 { display: flex; align-items: center; gap: 12px; background: var(--background); padding: 4px 4px 4px 16px; border-radius: 30px; border: 1px solid var(--surface-alt); }
        .badge-text { display: flex; flex-direction: column; text-align: right; }
        .badge-text strong { font-size: 0.85rem; line-height: 1.2; }
        .badge-text span { font-size: 0.7rem; color: var(--primary); font-weight: 800; text-transform: uppercase; }
        .avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: var(--grad-primary); color: white; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; }
        .logout-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--surface-alt); background: white; color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); }
        .logout-btn:hover { color: #ef4444; border-color: #fecdd3; background: #fff1f2; }
        @media (max-width: 768px) { .nav-center { display: none; } .search-pill { width: auto; } }
      `}</style>
    </nav>
  );
};

export default Navbar;
