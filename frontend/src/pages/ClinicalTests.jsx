import React from 'react';
import {
    ClipboardCheck,
    Brain,
    Mic,
    Activity,
    Clock,
    Info,
    ChevronRight,
    TrendingUp,
    FileText
} from 'lucide-react';

const ClinicalTests = () => {
    const tests = [
        {
            id: 'mmse',
            category: 'Standardized Assessments',
            title: 'MMSE Assessment',
            desc: 'Mini-Mental State Examination for orientation, memory, and attention. Demographically adjusted scoring.',
            duration: '10-15 min',
            icon: <Brain size={28} />,
            accent: 'blue',
            path: '/tests/mmse'
        },
        {
            id: 'moca',
            category: 'Standardized Assessments',
            title: 'MoCA Assessment',
            desc: 'Montreal Cognitive Assessment for detecting mild cognitive impairment with normative adjustment.',
            duration: '15-20 min',
            icon: <Activity size={28} />,
            accent: 'purple',
            path: '/tests/moca'
        },
        {
            id: 'speech',
            category: 'Digital Biomarkers',
            title: 'Speech Pattern Analysis',
            desc: 'Automated AI analysis of linguistic markers and vocal characteristics using ML model.',
            duration: '5 min',
            icon: <Mic size={28} />,
            accent: 'orange',
            path: '/speech-test'
        },
        {
            id: 'clock',
            category: 'Cognitive Exercises',
            title: 'Clock Drawing Task',
            desc: 'Interactive canvas test assessing executive function and visuospatial organization.',
            duration: '5 min',
            icon: <Clock size={28} />,
            accent: 'green',
            path: '/tests/clock'
        },
        {
            id: 'trail',
            category: 'Cognitive Exercises',
            title: 'Trail Making Test — A',
            desc: 'Connect numbered dots in sequence. Tests processing speed and attention / concentration.',
            duration: '3-5 min',
            icon: <TrendingUp size={28} />,
            accent: 'red',
            path: '/tests/trail'
        },
    ];


    return (
        <div className="tests-page container animate-fade-up">
            <header className="tests-header">
                <div className="title-block">
                    <h1>Diagnostic Battery</h1>
                    <p>Please select a clinical assessment to begin. These tests should be taken in a quiet environment.</p>
                </div>
                <div className="status-summary">
                    <div className="status-item">
                        <TrendingUp size={16} className="text-secondary" />
                        <span>3 Tests Pending</span>
                    </div>
                </div>
            </header>

            <div className="test-sections">
                {/* Categories Grid */}
                <div className="tests-grid-v2">
                    {tests.map((test) => (
                        <div key={test.id} className={`card-modern test-card-v2 entry-${test.accent}`}>
                            <div className="test-icon-v2">
                                {test.icon}
                            </div>
                            <div className="test-body-v2">
                                <span className="category-label">{test.category}</span>
                                <h3>{test.title}</h3>
                                <p>{test.desc}</p>
                                <div className="test-meta-v2">
                                    <Clock size={14} /> <span>Est. {test.duration}</span>
                                </div>
                                <button className="btn-primary-sm-wide mt-4" onClick={() => window.location.href = test.path}>
                                    Start Assessment <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Requirements Sidebar */}
                <aside className="test-sidebar">
                    <div className="card-modern prep-card">
                        <h3><Info size={18} className="text-primary" /> Preparation Guide</h3>
                        <ul className="guide-list">
                            <li>Ensure your device audio/microphone is working correctly.</li>
                            <li>Settle in a well-lit, quiet room with no distractions.</li>
                            <li>Read all instructions carefully before starting each task.</li>
                            <li>If wearing hearing aids or glasses, please ensure they are on.</li>
                        </ul>
                    </div>

                    <div className="doctor-note-card">
                        <ClipboardCheck size={24} className="text-white" />
                        <div>
                            <strong>Clinician Note</strong>
                            <p>These tests are for screening purposes and do not constitute a final diagnosis.</p>
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx>{`
        .tests-page { padding: 40px 0; }
        .tests-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; border-bottom: 1px solid var(--surface-alt); padding-bottom: 32px; }
        .title-block h1 { font-size: 2.5rem; margin-bottom: 12px; }
        .title-block p { color: var(--text-sub); font-size: 1.1rem; max-width: 600px; }
        .status-summary { background: white; padding: 12px 24px; border-radius: 30px; box-shadow: var(--shadow-sm); font-weight: 700; color: var(--text-main); font-size: 0.9rem; }
        
        .test-sections { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
        
        .tests-grid-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .test-card-v2 { 
          display: flex; flex-direction: column; gap: 20px; text-align: left; position: relative;
          border-top: 4px solid transparent; transition: var(--transition);
        }
        .entry-blue { border-top-color: var(--primary); }
        .entry-purple { border-top-color: var(--accent); }
        .entry-orange { border-top-color: var(--warning); }
        .entry-green { border-top-color: var(--secondary); }
        .entry-red { border-top-color: #ef4444; }

        .test-icon-v2 { 
          width: 56px; height: 56px; border-radius: 12px; background: var(--background); 
          display: flex; align-items: center; justify-content: center; color: var(--text-main);
        }
        .entry-blue .test-icon-v2 { color: var(--primary); background: #f0f7ff; }
        .entry-purple .test-icon-v2 { color: var(--accent); background: #f5f3ff; }
        .entry-orange .test-icon-v2 { color: var(--warning); background: #fff7ed; }
        .entry-green .test-icon-v2 { color: var(--secondary); background: #f0fdf4; }

        .category-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; }
        .test-body-v2 h3 { font-size: 1.3rem; margin-bottom: 10px; }
        .test-body-v2 p { font-size: 0.9rem; color: var(--text-sub); line-height: 1.5; margin-bottom: 20px; }
        
        .test-meta-v2 { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }
        .btn-primary-sm-wide { 
          width: 100%; background: var(--grad-primary); border: none; color: white; padding: 12px; border-radius: 10px; 
          font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: var(--transition);
        }
        .btn-primary-sm-wide:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(74, 144, 226, 0.3); }

        .test-sidebar { display: flex; flex-direction: column; gap: 24px; }
        .prep-card h3 { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin-bottom: 20px; }
        .guide-list { padding-left: 20px; display: flex; flex-direction: column; gap: 14px; color: var(--text-sub); font-size: 0.9rem; }
        .guide-list li { line-height: 1.4; }

        .doctor-note-card { background: var(--grad-accent); padding: 24px; border-radius: var(--radius-lg); color: white; display: flex; gap: 16px; align-items: flex-start; }
        .doctor-note-card strong { font-size: 1.1rem; margin-bottom: 4px; display: block; }
        .doctor-note-card p { font-size: 0.85rem; opacity: 0.9; }

        @media (max-width: 1200px) {
          .tests-grid-v2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .test-sections { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default ClinicalTests;
