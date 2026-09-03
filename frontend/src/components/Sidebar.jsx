import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, ClipboardCheck, Mic, Upload,
  FileText, UserRound, LogOut, ChevronRight, Settings, Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const isDoctor = user?.role === 'doctor';

  const patientMenuItems = [
    { name: 'Dashboard',   path: '/dashboard',      icon: <LayoutDashboard size={20} /> },
    { name: 'Tests',       path: '/tests',          icon: <ClipboardCheck size={20} /> },
    { name: 'Speech Test', path: '/speech-test',    icon: <Mic size={20} /> },
    { name: 'MRI Upload',  path: '/mri-upload',     icon: <Upload size={20} /> },
    { name: 'Reports',     path: '/reports',        icon: <FileText size={20} /> },
    { name: 'Specialists', path: '/consult-doctor', icon: <UserRound size={20} /> },
  ];

  const doctorMenuItems = [
    { name: 'Patient Portal', path: '/doctor-portal', icon: <Stethoscope size={20} /> },
    { name: 'Reports',        path: '/reports',       icon: <FileText size={20} /> },
  ];

  const menuItems = isDoctor ? doctorMenuItems : patientMenuItems;

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.full_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CF';

  return (
    <aside className="sidebar-enhanced">
      <div className="sidebar-brand">
        <div className="brand-icon-sq"><Activity size={24} strokeWidth={3} /></div>
        <div className="brand-text">
          <strong>CogniFusion</strong>
          <span>{isDoctor ? 'Doctor Portal' : 'Clinical Hub'}</span>
        </div>
      </div>

      <nav className="nav-stack">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
              <div className="nav-icon-wrap">{item.icon}</div>
              <span className="nav-name">{item.name}</span>
              {isActive && <ChevronRight size={14} className="active-arrow" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        {/* Profile link (patients only) */}
        {!isDoctor && (
          <Link to="/profile" className={`nav-link-mini profile-link ${location.pathname === '/profile' ? 'active-mini' : ''}`}>
            <Settings size={18} /> My Profile
          </Link>
        )}
        <button className="nav-link-mini logout-text" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
        <div className="user-profile-mini">
          <div className="u-avatar" style={{ background: isDoctor ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }}>
            {initials}
          </div>
          <div className="u-info">
            <strong>{user?.full_name || 'User'}</strong>
            <span>{isDoctor ? '👨‍⚕️ Doctor' : user?.patient_id || 'Patient Account'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .sidebar-enhanced { width: 280px; background: white; border-right: 1px solid var(--surface-alt); height: 100vh; display: flex; flex-direction: column; position: sticky; top: 0; z-index: 50; }
        .sidebar-brand { padding: 32px 24px; display: flex; align-items: center; gap: 12px; }
        .brand-icon-sq { width: 40px; height: 40px; background: var(--grad-primary); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .brand-text { display: flex; flex-direction: column; }
        .brand-text strong { font-size: 1.1rem; color: var(--text-main); line-height: 1.2; }
        .brand-text span { font-size: 0.75rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .nav-stack { flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 4px; }
        .nav-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; text-decoration: none; color: var(--text-sub); font-weight: 600; border-radius: 12px; transition: var(--transition); }
        .nav-link:hover { background: var(--background); color: var(--primary); }
        .nav-link.active { background: var(--surface-alt); color: var(--primary); }
        .nav-icon-wrap { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; }
        .active-arrow { margin-left: auto; color: var(--primary); }
        .sidebar-foot { padding: 16px; border-top: 1px solid var(--surface-alt); display: flex; flex-direction: column; gap: 4px; }
        .nav-link-mini { display: flex; align-items: center; gap: 8px; padding: 10px 16px; text-decoration: none; color: var(--text-sub); font-size: 0.9rem; font-weight: 600; background: none; border: none; cursor: pointer; width: 100%; border-radius: 10px; transition: var(--transition); }
        .logout-text:hover { color: #ef4444; background: #fff1f2; }
        .profile-link:hover { color: var(--primary); background: var(--background); }
        .active-mini { background: var(--surface-alt); color: var(--primary); }
        .user-profile-mini { margin-top: 8px; padding: 14px; background: var(--background); border-radius: 16px; display: flex; align-items: center; gap: 12px; }
        .u-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--grad-primary); color: white; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .u-info strong { font-size: 0.85rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
        .u-info span { font-size: 0.72rem; color: var(--text-muted); }
        @media (max-width: 992px) { .sidebar-enhanced { display: none; } }
      `}</style>
    </aside>
  );
};

export default Sidebar;
