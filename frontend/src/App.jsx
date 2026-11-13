import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';
import Navbar            from './components/Navbar';
import Sidebar           from './components/Sidebar';
import LandingPage       from './pages/LandingPage';
import Login             from './pages/Login';
import Signup            from './pages/Signup';
import Dashboard         from './pages/Dashboard';
import ClinicalTests     from './pages/ClinicalTests';
import MMSETest          from './pages/MMSETest';
import MoCATest          from './pages/MoCATest';
import SpeechTest        from './pages/SpeechTest';
import MRIUpload         from './pages/MRIUpload';
import Reports           from './pages/Reports';
import ConsultDoctor     from './pages/ConsultDoctor';
import ProfileEdit       from './pages/ProfileEdit';
import DoctorPortal      from './pages/DoctorPortal';
import ClockDrawingTest  from './pages/ClockDrawingTest';
import TrailMakingTest   from './pages/TrailMakingTest';
import './styles/global.css';

const noSidebarPaths = ['/', '/login', '/signup'];

const Layout = ({ children }) => {
  const location = useLocation();
  const showSidebar = !noSidebarPaths.includes(location.pathname);
  return (
    <div style={{ display: 'flex', flex: 1 }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, background: 'var(--background)' }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/"       element={<LandingPage />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected — Patient */}
              <Route path="/dashboard"      element={<ProtectedRoute role="patient"><Dashboard /></ProtectedRoute>} />
              <Route path="/tests"          element={<ProtectedRoute role="patient"><ClinicalTests /></ProtectedRoute>} />
              <Route path="/tests/mmse"     element={<ProtectedRoute role="patient"><MMSETest /></ProtectedRoute>} />
              <Route path="/tests/moca"     element={<ProtectedRoute role="patient"><MoCATest /></ProtectedRoute>} />
              <Route path="/tests/clock"    element={<ProtectedRoute role="patient"><ClockDrawingTest /></ProtectedRoute>} />
              <Route path="/tests/trail"    element={<ProtectedRoute role="patient"><TrailMakingTest /></ProtectedRoute>} />
              <Route path="/speech-test"    element={<ProtectedRoute role="patient"><SpeechTest /></ProtectedRoute>} />
              <Route path="/mri-upload"     element={<ProtectedRoute role="patient"><MRIUpload /></ProtectedRoute>} />
              <Route path="/reports"        element={<ProtectedRoute role="patient"><Reports /></ProtectedRoute>} />
              <Route path="/consult-doctor" element={<ProtectedRoute role="patient"><ConsultDoctor /></ProtectedRoute>} />
              <Route path="/profile"        element={<ProtectedRoute role="patient"><ProfileEdit /></ProtectedRoute>} />

              {/* Doctor portal (JWT + role=doctor enforced on backend) */}
              <Route path="/doctor-portal"  element={<ProtectedRoute role="doctor"><DoctorPortal /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
