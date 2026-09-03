import React, { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle, ArrowRight, Brain, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mriService } from '../services/api';

const MRIUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles]         = useState([]);
  const [isDragging, setDragging] = useState(false);
  const [phase, setPhase]         = useState('idle'); // idle | uploading | done | error
  const [results, setResults]     = useState([]);
  const [error, setError]         = useState('');

  const ALLOWED = ['.dcm', '.nii', '.nrrd', '.png', '.jpg', '.jpeg'];

  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return ALLOWED.includes(ext);
    });
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name))].slice(0, 10);
    });
  }, []);

  const removeFile = (name) => setFiles((f) => f.filter((x) => x.name !== name));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setPhase('uploading');
    setError('');

    const formData = new FormData();
    files.forEach((f) => formData.append('scans', f));

    try {
      const { data } = await mriService.upload(formData);
      setResults(data.data);
      setPhase('done');
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please check the file formats and try again.');
      setPhase('error');
    }
  };

  const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const getRiskColor = (risk) => ({ Low: '#6FCF97', Moderate: '#F59E0B', High: '#EF4444' }[risk] || '#4A90E2');

  return (
    <div className="mri-upload-v2 container animate-fade-up">
      <div className="mri-header">
        <div className="icon-header-sq" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Upload size={28} />
        </div>
        <div>
          <h1>MRI Neuroimaging Analysis</h1>
          <p>Upload DICOM, NIfTI, or NRRD brain scans. Our AI performs volumetric hippocampal assessment.</p>
        </div>
      </div>

      {error && (
        <div className="alert-block alert-danger mb-4">
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {phase !== 'done' && (
        <>
          {/* Drop Zone */}
          <div
            className={`drop-zone-v2 ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('mri-file-input').click()}
          >
            <input
              id="mri-file-input" type="file" multiple accept=".dcm,.nii,.nrrd,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="drop-icon-wrapper">
              <Upload size={48} />
            </div>
            <h3>Drag & Drop Scan Files</h3>
            <p>or click to browse — supports DICOM, NIfTI, NRRD, PNG, JPEG (max 10 files · 50MB each)</p>
            <div className="format-tags">
              {ALLOWED.map((f) => <span key={f} className="format-tag">{f.toUpperCase()}</span>)}
            </div>
          </div>

          {/* File Queue */}
          {files.length > 0 && (
            <div className="file-queue card-modern mt-4">
              <div className="queue-header">
                <h3><File size={20} /> {files.length} file{files.length > 1 ? 's' : ''} queued</h3>
                <button className="text-link" onClick={() => setFiles([])}>Clear All</button>
              </div>
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className="file-row">
                    <div className="f-icon"><File size={20} /></div>
                    <div className="f-info">
                      <strong>{f.name}</strong>
                      <span>{formatSize(f.size)}</span>
                    </div>
                    <button className="f-remove" onClick={() => removeFile(f.name)}>
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              {phase === 'uploading' ? (
                <div className="upload-progress-msg">
                  <Loader size={20} className="spin-icon" />
                  <span>Uploading and analyzing scans...</span>
                  <style jsx>{`.spin-icon{animation:spin 1.2s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : (
                <button className="btn-analyze" onClick={handleSubmit}>
                  <Brain size={20} /> Run AI Analysis <ArrowRight size={20} />
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Results */}
      {phase === 'done' && results.length > 0 && (
        <div className="results-section mt-4">
          <div className="card-modern results-header-card">
            <CheckCircle2 size={40} className="text-secondary" />
            <h2>Analysis Complete — {results.length} Scan{results.length > 1 ? 's' : ''} Processed</h2>
            <p>Results have been saved to your clinical profile and a report has been generated.</p>
          </div>
          <div className="scan-result-grid">
            {results.map((r, i) => (
              <div key={i} className="scan-result-card" style={{ borderLeft: `4px solid ${getRiskColor(r.risk_level)}` }}>
                <div className="s-file-name"><File size={16} /> {r.file_name}</div>
                <div className="s-metrics">
                  <div className="s-metric"><span>Risk Level</span><strong style={{ color: getRiskColor(r.risk_level) }}>{r.risk_level}</strong></div>
                  <div className="s-metric"><span>Status</span><strong>{r.status}</strong></div>
                  <div className="s-metric"><span>Hippocampal Vol.</span><strong>{r.hippocampal_vol.toFixed(0)} mm³</strong></div>
                  <div className="s-metric"><span>Atrophy</span><strong>{r.atrophy_pct}%</strong></div>
                </div>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="btn-primary-lg" onClick={() => navigate('/reports')}>View Clinical Reports <ArrowRight size={20} /></button>
            <button className="btn-outline" onClick={() => { setPhase('idle'); setResults([]); }}>Upload More Scans</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .mri-upload-v2 { padding: 40px 0; max-width: 800px; }
        .mri-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .icon-header-sq { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .mri-header h1 { font-size: 2rem; margin-bottom: 6px; }
        .mri-header p { color: var(--text-sub); }
        .alert-block { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; }
        .alert-danger { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        .drop-zone-v2 { border: 2px dashed var(--surface-alt); border-radius: 20px; padding: 60px 40px; text-align: center; cursor: pointer; transition: var(--transition); background: white; }
        .drop-zone-v2:hover, .drop-zone-v2.dragging { border-color: var(--secondary); background: #f0fdf4; }
        .drop-icon-wrapper { width: 80px; height: 80px; background: #f0fdf4; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--secondary); margin: 0 auto 20px; }
        .drop-zone-v2 h3 { font-size: 1.5rem; margin-bottom: 10px; }
        .drop-zone-v2 p { color: var(--text-sub); max-width: 480px; margin: 0 auto 20px; }
        .format-tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .format-tag { background: #f0fdf4; color: var(--secondary); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .file-queue { padding: 24px; }
        .queue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .text-link { background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; }
        .file-row { display: flex; align-items: center; gap: 16px; padding: 14px; border: 1px solid var(--surface-alt); border-radius: 12px; margin-bottom: 8px; }
        .f-icon { width: 40px; height: 40px; background: #f0fdf4; color: var(--secondary); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .f-info { flex: 1; }
        .f-info strong { font-size: 0.9rem; display: block; }
        .f-info span { font-size: 0.8rem; color: var(--text-muted); }
        .f-remove { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 6px; }
        .f-remove:hover { background: #fff1f2; color: #ef4444; }
        .upload-progress-msg { display: flex; align-items: center; gap: 12px; color: var(--primary); font-weight: 600; padding: 16px 0; justify-content: center; }
        .btn-analyze { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; margin-top: 16px; }
        .results-section { display: flex; flex-direction: column; gap: 24px; }
        .results-header-card { text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .results-header-card h2 { font-size: 1.8rem; }
        .scan-result-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .scan-result-card { background: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-sm); }
        .s-file-name { display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--surface-alt); }
        .s-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .s-metric { text-align: center; }
        .s-metric span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: block; text-transform: uppercase; }
        .s-metric strong { font-size: 1.1rem; }
        .result-actions { display: flex; gap: 16px; }
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 28px; background: var(--primary); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; }
        .btn-outline { padding: 14px 28px; background: white; color: var(--text-main); border: 1px solid var(--surface-alt); border-radius: 12px; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default MRIUpload;
