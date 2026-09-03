import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Mic,
  Upload,
  Activity,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="landing-enhanced">
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="container hero-grid">
          <div className="hero-content-modern animate-fade-up">
            <div className="badge-ai">
              <Activity size={16} />
              <span>AI-Powered Early Cognitive Screening</span>
            </div>
            <h1>Precision Digital Diagnostics for <span className="text-gradient">Brain Health</span></h1>
            <p>
              CogniFusion helps detect early signs of Alzheimer's and Dementia using
              clinically-validated cognitive tests, speech pattern analysis, and MRI AI insights.
            </p>
            <div className="hero-actions-modern">
              <Link to="/signup" className="btn-primary-lg">
                Start Cognitive Assessment <ArrowRight size={20} />
              </Link>
              <Link to="/how-it-works" className="btn-outline-lg">
                <Play size={18} fill="currentColor" /> Learn How It Works
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={18} />
              <span>HIPAA Compliant • Clinical Grade • 98% Diagnostic Sensitivity</span>
            </div>
          </div>

          <div className="hero-viz">
            <div className="viz-container">
              <div className="brain-glow"></div>
              <Brain size={240} className="brain-main floating" strokeWidth={1} />
              <div className="neural-node node-1 pulse-s"></div>
              <div className="neural-node node-2 pulse-s"></div>
              <div className="neural-node node-3 pulse-s"></div>
              <div className="viz-card card-1 animate-fade-up">
                <Activity size={20} className="text-secondary" />
                <div>
                  <strong>Cognitive Load</strong>
                  <span>Analyzing... 74%</span>
                </div>
              </div>
              <div className="viz-card card-2 animate-fade-up">
                <Mic size={20} className="text-accent" />
                <div>
                  <strong>Vocal Marker</strong>
                  <span>Stable Spectrum</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="features-modern container">
        <div className="section-header-center">
          <span className="subtitle">Diagnostic Suite</span>
          <h2>Multimodal Health Analysis</h2>
          <p>We combine three distinct clinical pathways for a 360° view of cognitive state.</p>
        </div>

        <div className="feature-cards-grid">
          <div className="card-modern feature-item">
            <div className="icon-bg bg-blue">
              <Brain size={32} />
            </div>
            <h3>Clinical Cognitive Tests</h3>
            <p>Standardized MMSE and MoCA assessments enhanced with digital behavioral tracking.</p>
            <Link to="/tests" className="link-more">Learn more <ChevronRight size={16} /></Link>
          </div>

          <div className="card-modern feature-item">
            <div className="icon-bg bg-purple">
              <Mic size={32} />
            </div>
            <h3>Speech Pattern Analysis</h3>
            <p>Advanced NLP models detecting linguistic anomalies and vocal biomarkers in real-time.</p>
            <Link to="/speech-test" className="link-more">Learn more <ChevronRight size={16} /></Link>
          </div>

          <div className="card-modern feature-item">
            <div className="icon-bg bg-green">
              <Upload size={32} />
            </div>
            <h3>MRI Scan Insights</h3>
            <p>Neural network analysis of DICOM images for volumetric hippocampal assessment.</p>
            <Link to="/mri-upload" className="link-more">Learn more <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Proof/Value Section */}
      <section className="value-section">
        <div className="container value-grid">
          <div className="value-img">
            <Stethoscope size={200} className="text-primary-soft opacity-20" />
          </div>
          <div className="value-content">
            <h2>Trusted by Neurologists Worldwide</h2>
            <div className="check-list">
              <div className="check-item">
                <CheckCircle2 size={24} className="text-secondary" />
                <div>
                  <h4>Evidence-Based Protocols</h4>
                  <p>Our methodology is based on leading research in computational psychiatry.</p>
                </div>
              </div>
              <div className="check-item">
                <CheckCircle2 size={24} className="text-secondary" />
                <div>
                  <h4>Longitudinal Tracking</h4>
                  <p>Monitor changes over years with precise delta-scoring and trend visualization.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-enhanced {
          overflow-x: hidden;
        }
        
        /* Hero Styles */
        .hero-modern {
          padding: 100px 0;
          background: radial-gradient(circle at 90% 10%, rgba(74, 144, 226, 0.05) 0%, transparent 60%),
                      radial-gradient(circle at 10% 90%, rgba(111, 207, 151, 0.05) 0%, transparent 60%);
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 60px;
        }
        .badge-ai {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-alt);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }
        .hero-content-modern h1 {
          font-size: 4rem;
          line-height: 1.1;
          margin-bottom: 24px;
        }
        .text-gradient {
          background: var(--grad-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-content-modern p {
          font-size: 1.25rem;
          color: var(--text-sub);
          margin-bottom: 40px;
          max-width: 540px;
        }
        .hero-actions-modern {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
        }
        .hero-trust {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Brain Viz */
        .hero-viz {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .viz-container {
          position: relative;
          width: 400px;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brain-main {
          color: var(--primary);
          filter: drop-shadow(0 0 30px rgba(74, 144, 226, 0.2));
        }
        .floating {
          animation: float 6s ease-in-out infinite;
        }
        .brain-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: var(--primary);
          filter: blur(100px);
          opacity: 0.1;
          border-radius: 50%;
        }
        .neural-node {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--secondary);
        }
        .node-1 { top: 20%; right: 20%; }
        .node-2 { bottom: 30%; left: 15%; }
        .node-3 { top: 50%; left: 10%; background: var(--accent); }
        .pulse-s { animation: pulse-soft 2s infinite; }

        .viz-card {
          position: absolute;
          background: white;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--surface-alt);
        }
        .viz-card div { display: flex; flex-direction: column; }
        .viz-card strong { font-size: 0.9rem; }
        .viz-card span { font-size: 0.8rem; color: var(--text-sub); }
        .card-1 { top: 10%; left: -20px; animation-delay: 0.2s; }
        .card-2 { bottom: 10%; right: -20px; animation-delay: 0.4s; }

        /* Feature Section */
        .features-modern {
          padding: 100px 0;
        }
        .section-header-center {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 60px;
        }
        .subtitle {
          color: var(--primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.85rem;
          margin-bottom: 12px;
          display: block;
        }
        .section-header-center h2 { font-size: 2.5rem; margin-bottom: 16px; }
        .section-header-center p { color: var(--text-sub); font-size: 1.1rem; }

        .feature-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .feature-item {
          text-align: left;
        }
        .icon-bg {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: white;
        }
        .bg-blue { background: var(--grad-primary); box-shadow: 0 10px 20px rgba(74, 144, 226, 0.2); }
        .bg-purple { background: var(--grad-accent); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); }
        .bg-green { background: linear-gradient(135deg, #6FCF97, #27AE60); box-shadow: 0 10px 20px rgba(111, 207, 151, 0.2); }

        .feature-item h3 { font-size: 1.4rem; margin-bottom: 12px; }
        .feature-item p { color: var(--text-sub); margin-bottom: 24px; font-size: 0.95rem; }
        .link-more {
          color: var(--primary);
          text-decoration: none;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Value Section */
        .value-section {
          padding: 80px 0;
          background: var(--surface-alt);
          border-radius: 50px 50px 0 0;
        }
        .value-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
        }
        .check-list { display: grid; gap: 30px; margin-top: 40px; }
        .check-item { display: flex; gap: 20px; }
        .check-item h4 { font-size: 1.1rem; margin-bottom: 4px; }
        .check-item p { color: var(--text-sub); font-size: 0.95rem; }

        @media (max-width: 992px) {
          .hero-grid, .value-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-content-modern p { margin: 0 auto 40px; }
          .hero-actions-modern { justify-content: center; }
          .hero-viz { display: none; }
          .feature-cards-grid { grid-template-columns: 1fr; }
          .hero-content-modern h1 { font-size: 2.8rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
