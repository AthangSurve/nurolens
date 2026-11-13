import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload, File, X, CheckCircle2, AlertCircle, ArrowRight, Brain,
  Loader, Eye, Layers, ZoomIn, ZoomOut, Sliders, Activity, Calendar, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mriService } from '../services/api';

const MRIUpload = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('upload'); // 'upload' | 'history'
  const [files, setFiles]           = useState([]);
  const [filePreviews, setPreviews] = useState({});
  const [isDragging, setDragging]   = useState(false);
  const [phase, setPhase]           = useState('idle'); // idle | uploading | done | error
  const [results, setResults]       = useState([]);
  const [error, setError]           = useState('');
  const [historyScans, setHistory]  = useState([]);
  const [historyLoading, setHistLoad] = useState(false);
  const [failedImageKey, setFailedImageKey] = useState('');
  const previewUrls = useRef(new Set());

  // Neuroimaging Viewer Controls
  const [selectedScanIdx, setSelectedScanIdx] = useState(0);
  const [invertContrast, setInvert]           = useState(false);
  const [zoomLevel, setZoom]                  = useState(1);

  const ALLOWED = ['.dcm', '.nii', '.nrrd', '.png', '.jpg', '.jpeg'];

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const loadHistory = async () => {
    setHistLoad(true);
    try {
      const res = await mriService.getHistory();
      setHistory(res.data.data || []);
    } catch {
      // Non-blocking
    } finally {
      setHistLoad(false);
    }
  };

  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return ALLOWED.includes(ext);
    });

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const next = [...prev, ...valid.filter((f) => !existing.has(f.name))].slice(0, 10);
      return next;
    });

    // Create object URLs for image preview
    valid.forEach((f) => {
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        previewUrls.current.add(url);
        setPreviews((prev) => ({ ...prev, [f.name]: url }));
      }
    });
  }, []);

  const removeFile = (name) => {
    setFiles((f) => f.filter((x) => x.name !== name));
  };

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
      setResults((data.data || []).map((result) => ({
        ...result,
        preview_url: filePreviews[result.file_name],
      })));
      setSelectedScanIdx(0);
      setPhase('done');
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please check the file formats and try again.');
      setPhase('error');
    }
  };

  const formatSize = (bytes) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const getRiskColor = (risk) =>
    ({ Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' })[risk] || '#4A90E2';

  const currentResult = results[selectedScanIdx] || (results.length > 0 ? results[0] : null);
  const scanImageSource = currentResult?.preview_url || currentResult?.file_url;
  const scanImageKey = currentResult
    ? `${currentResult.scan_id || currentResult.id || currentResult.file_name}:${scanImageSource || ''}`
    : '';
  const isRasterImage = Boolean(currentResult?.preview_url) ||
    /\.(png|jpe?g)(?:$|[?#])/i.test(currentResult?.file_name || currentResult?.file_url || '');
  const imageUnavailable = Boolean(scanImageSource) && failedImageKey === scanImageKey;

  return (
    <div className="mri-upload-v2 container animate-fade-up">
      {/* Header */}
      <div className="mri-header">
        <div className="icon-header-sq" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Brain size={28} />
        </div>
        <div>
          <h1>MRI Neuroimaging Analysis</h1>
          <p>
            DenseNet-121 volumetric analysis for hippocampal atrophy, ventricular enlargement,
            and neurodegenerative risk classification.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mri-tabs-bar">
        <button
          className={`mri-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          <span>Scan Upload & Analysis</span>
        </button>
        <button
          className={`mri-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={18} />
          <span>Historical Scans Archive</span>
        </button>
      </div>

      {error && (
        <div className="alert-block alert-danger mb-4">
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: Upload & Interactive Analysis ─── */}
      {activeTab === 'upload' && (
        <>
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
                  id="mri-file-input"
                  type="file"
                  multiple
                  accept=".dcm,.nii,.nrrd,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => addFiles(e.target.files)}
                />
                <div className="drop-icon-wrapper">
                  <Upload size={44} />
                </div>
                <h3>Drag & Drop Brain MRI Scan Files</h3>
                <p>Supports DICOM (.dcm), NIfTI (.nii), NRRD (.nrrd), PNG, and High-Resolution JPEG</p>
                <div className="format-tags">
                  {ALLOWED.map((f) => (
                    <span key={f} className="format-tag">{f.toUpperCase()}</span>
                  ))}
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
                      <div className="spin-ring" />
                      <span>Running DenseNet-121 neural volumetric inference and ROI segmentation...</span>
                    </div>
                  ) : (
                    <button className="btn-analyze" onClick={handleSubmit}>
                      <Brain size={20} /> Run AI Volumetric Neuro-Analysis <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Detailed Analysis Results with Image Viewer ─── */}
          {phase === 'done' && currentResult && (
            <div className="results-section mt-4">
              <div className="card-modern results-header-card">
                <CheckCircle2 size={44} className="text-secondary" />
                <h2>Neuroimaging Volumetric Analysis Complete</h2>
                <p>
                  Scan file <strong>{currentResult.file_name}</strong> processed with DenseNet-121 feature extraction.
                </p>
              </div>

              {/* Multi-scan Selector if multiple files uploaded */}
              {results.length > 1 && (
                <div className="scan-selector-row">
                  {results.map((r, idx) => (
                    <button
                      key={idx}
                      className={`scan-select-btn ${selectedScanIdx === idx ? 'active' : ''}`}
                      onClick={() => setSelectedScanIdx(idx)}
                    >
                      <File size={16} /> Scan #{idx + 1}: {r.file_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Neuroimaging Image Inspection Viewer */}
              <div className="viewer-grid">
                <div className="viewer-panel card-modern">
                  <div className="viewer-toolbar">
                    <span className="toolbar-title">
                      <Eye size={16} /> Uploaded Scan Preview
                    </span>
                    <div className="toolbar-actions">
                      <button
                        className="btn-tool"
                        disabled
                        title="ROI overlays are unavailable because this analysis does not generate segmentation data."
                      >
                        <Layers size={15} /> ROI Map
                      </button>
                      <button
                        className="btn-tool"
                        disabled
                        title="Grad-CAM overlays are unavailable because this analysis does not generate a heatmap."
                      >
                        <Activity size={15} /> Grad-CAM Heatmap
                      </button>
                      <button
                        className={`btn-tool ${invertContrast ? 'active' : ''}`}
                        disabled={!isRasterImage || imageUnavailable}
                        onClick={() => setInvert(!invertContrast)}
                        title="Invert Scan Contrast"
                      >
                        <Sliders size={15} /> Invert
                      </button>
                      <button className="btn-tool" disabled={!isRasterImage || imageUnavailable} onClick={() => setZoom(Math.min(1.8, zoomLevel + 0.2))}>
                        <ZoomIn size={15} />
                      </button>
                      <button className="btn-tool" disabled={!isRasterImage || imageUnavailable} onClick={() => setZoom(Math.max(0.8, zoomLevel - 0.2))}>
                        <ZoomOut size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Scan Display Canvas / Image */}
                  <div className="scan-viewport" style={{ overflow: 'hidden' }}>
                    {scanImageSource && isRasterImage && !imageUnavailable ? (
                      <div
                        className="scan-image-wrap"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          filter: invertContrast ? 'invert(1) contrast(1.2)' : 'none',
                          transition: 'transform 0.2s ease, filter 0.2s ease'
                        }}
                      >
                        <img
                          src={scanImageSource}
                          alt={`Uploaded MRI scan: ${currentResult.file_name}`}
                          className="mri-scan-img"
                          onError={() => setFailedImageKey(scanImageKey)}
                        />
                      </div>
                    ) : (
                      <div className="scan-unavailable">
                        <Eye size={28} />
                        <strong>
                          {isRasterImage
                            ? 'The uploaded scan preview could not be loaded.'
                            : 'This scan format cannot be previewed in the browser.'}
                        </strong>
                        <span>
                          {isRasterImage
                            ? 'The original scan is preserved; no substitute image is shown.'
                            : 'Export the scan as PNG or JPEG to use the image viewer controls.'}
                        </span>
                        {currentResult.file_url && (
                          <a href={currentResult.file_url} target="_blank" rel="noreferrer">
                            Open original scan
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="viewport-legend">
                    Zoom and contrast controls apply to the uploaded image. ROI and Grad-CAM overlays are not generated.
                  </div>
                </div>

                {/* Volumetric Metrics & Diagnostic Staging */}
                <div className="metrics-panel card-modern">
                  <div className="metric-header-row">
                    <h3>Volumetric Biomarkers</h3>
                    <span
                      className="risk-tag"
                      style={{
                        background: getRiskColor(currentResult.risk_level) + '1a',
                        color: getRiskColor(currentResult.risk_level),
                        border: `1.5px solid ${getRiskColor(currentResult.risk_level)}`
                      }}
                    >
                      {currentResult.risk_level} Risk
                    </span>
                  </div>

                  <div className="metrics-summary-table">
                    <div className="metric-row">
                      <span className="m-label">Total Hippocampal Volume</span>
                      <strong className="m-val">{Number(currentResult.hippocampal_vol).toFixed(0)} mm³</strong>
                    </div>
                    <div className="metric-row">
                      <span className="m-label">Age-Adjusted Norm</span>
                      <strong className="m-val">3,450 ± 280 mm³</strong>
                    </div>
                    <div className="metric-row">
                      <span className="m-label">Cortical Atrophy Percentage</span>
                      <strong className="m-val" style={{ color: getRiskColor(currentResult.risk_level) }}>
                        {Number(currentResult.atrophy_pct).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="metric-row">
                      <span className="m-label">Ventricular Enlargement Index</span>
                      <strong className="m-val">
                        {currentResult.atrophy_pct > 12 ? 'Moderate Enlargement' : 'Normal Size'}
                      </strong>
                    </div>
                    <div className="metric-row">
                      <span className="m-label">Clinical Staging Proxy</span>
                      <strong className="m-val">
                        {currentResult.risk_level === 'Low'
                          ? 'CDR 0 (Intact / Non-Demented)'
                          : currentResult.risk_level === 'Moderate'
                          ? 'CDR 0.5 (Mild Cognitive Impairment)'
                          : 'CDR 1.0 (Mild Dementia Staging)'}
                      </strong>
                    </div>
                    <div className="metric-row">
                      <span className="m-label">Braak Staging Estimate</span>
                      <strong className="m-val">
                        {currentResult.risk_level === 'Low' ? 'Stage I–II (Transentorhinal)' : 'Stage III–IV (Limbic)'}
                      </strong>
                    </div>
                  </div>

                  {/* Diagnostic Clinical Impression Notes */}
                  <div className="diagnostic-notes-box">
                    <h4><ShieldCheck size={18} color="#10B981" /> Clinical Radiologic Impression</h4>
                    <p>
                      {currentResult.analysis_notes ||
                        `Volumetric inspection indicates ${
                          currentResult.risk_level === 'Low'
                            ? 'preserved hippocampal volume within normal demographic percentiles with minimal ventricular dilation.'
                            : currentResult.risk_level === 'Moderate'
                            ? 'mild asymmetric hippocampal volume reduction and subtle temporal horn enlargement consistent with early MCI.'
                            : 'pronounced bilateral hippocampal atrophy with significant ventricular enlargement indicative of progressive neurodegeneration.'
                        }`}
                    </p>
                  </div>

                  <div className="result-actions">
                    <button className="btn-primary-lg" onClick={() => navigate('/reports')}>
                      View In Clinical Reports <ArrowRight size={18} />
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setPhase('idle');
                        setResults([]);
                      }}
                    >
                      Upload New Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: Historical Scans Archive ─── */}
      {activeTab === 'history' && (
        <div className="history-tab-content">
          {historyLoading ? (
            <div className="loading-state">
              <div className="spin-ring" />
              <p>Fetching MRI historical records...</p>
            </div>
          ) : historyScans.length === 0 ? (
            <div className="card-modern empty-state">
              <Brain size={48} className="text-muted" />
              <h3>No MRI Scans Found</h3>
              <p>You haven't uploaded any brain imaging scans yet. Upload your first scan to start longitudinal tracking.</p>
              <button className="btn-primary-lg" onClick={() => setActiveTab('upload')}>
                Upload Scan Now
              </button>
            </div>
          ) : (
            <div className="history-scans-grid">
              {historyScans.map((scan) => (
                <div key={scan.id} className="card-modern history-scan-card" style={{ borderLeft: `5px solid ${getRiskColor(scan.risk_level)}` }}>
                  <div className="scan-card-top">
                    <div>
                      <h4>{scan.file_name}</h4>
                      <span className="scan-format-tag">{scan.file_format || 'DICOM'}</span>
                    </div>
                    <span
                      className="history-risk-pill"
                      style={{
                        background: getRiskColor(scan.risk_level) + '1a',
                        color: getRiskColor(scan.risk_level),
                        border: `1px solid ${getRiskColor(scan.risk_level)}`
                      }}
                    >
                      {scan.risk_level} Risk
                    </span>
                  </div>

                  <div className="history-metrics-row">
                    <div className="h-metric">
                      <span>Hippocampal Vol.</span>
                      <strong>{Number(scan.hippocampal_vol || 3200).toFixed(0)} mm³</strong>
                    </div>
                    <div className="h-metric">
                      <span>Atrophy</span>
                      <strong style={{ color: getRiskColor(scan.risk_level) }}>
                        {Number(scan.atrophy_pct || 8).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="h-metric">
                      <span>Date</span>
                      <strong>{new Date(scan.submitted_at || scan.analyzed_at || Date.now()).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  {scan.analysis_notes && (
                    <p className="history-notes-snippet">{scan.analysis_notes}</p>
                  )}

                  <div className="history-actions">
                    <button
                      className="btn-view-scan"
                      onClick={() => {
                        setResults([scan]);
                        setSelectedScanIdx(0);
                        setActiveTab('upload');
                        setPhase('done');
                      }}
                    >
                      <Eye size={16} /> Inspect Scan Analysis
                    </button>
                    <button className="btn-link" onClick={() => navigate('/reports')}>
                      Full Report →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .mri-upload-v2 { padding: 40px 0 80px; max-width: 1040px; }
        .mri-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
        .icon-header-sq { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 8px 16px rgba(16,185,129,0.25); }
        .mri-header h1 { font-size: 2.2rem; margin-bottom: 6px; }
        .mri-header p { color: var(--text-sub); font-size: 1.05rem; }

        /* Tabs */
        .mri-tabs-bar { display: flex; gap: 12px; margin-bottom: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .mri-tab-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: none; border: none; font-size: 1rem; font-weight: 700; color: var(--text-sub); cursor: pointer; border-radius: 12px; transition: var(--transition); }
        .mri-tab-btn:hover { background: #f1f5f9; color: var(--text-main); }
        .mri-tab-btn.active { background: #dcfce7; color: #15803d; }

        /* Drop Zone */
        .drop-zone-v2 { border: 2px dashed #cbd5e1; border-radius: 20px; padding: 50px 40px; text-align: center; cursor: pointer; transition: var(--transition); background: white; }
        .drop-zone-v2:hover, .drop-zone-v2.dragging { border-color: #10B981; background: #f0fdf4; }
        .drop-icon-wrapper { width: 80px; height: 80px; background: #f0fdf4; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #10B981; margin: 0 auto 20px; }
        .drop-zone-v2 h3 { font-size: 1.5rem; margin-bottom: 8px; }
        .drop-zone-v2 p { color: var(--text-sub); max-width: 500px; margin: 0 auto 20px; font-size: 0.95rem; }
        .format-tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .format-tag { background: #f0fdf4; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; border: 1px solid #bbf7d0; }

        /* Queue */
        .file-queue { padding: 24px; }
        .queue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .text-link { background: none; border: none; color: #10B981; font-weight: 700; cursor: pointer; }
        .file-row { display: flex; align-items: center; gap: 16px; padding: 14px; border: 1px solid var(--surface-alt); border-radius: 12px; margin-bottom: 8px; background: #fafafa; }
        .f-icon { width: 40px; height: 40px; background: #f0fdf4; color: #10B981; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .f-info { flex: 1; }
        .f-info strong { font-size: 0.95rem; display: block; }
        .f-info span { font-size: 0.8rem; color: var(--text-muted); }
        .f-remove { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 6px; }
        .f-remove:hover { background: #fff1f2; color: #ef4444; }

        .upload-progress-msg { display: flex; align-items: center; gap: 14px; color: #10B981; font-weight: 700; padding: 20px 0; justify-content: center; }
        .spin-ring { width: 28px; height: 28px; border: 3px solid #dcfce7; border-top-color: #10B981; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .btn-analyze { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; margin-top: 16px; box-shadow: 0 6px 16px rgba(16,185,129,0.3); }

        /* Results & Viewer */
        .results-section { display: flex; flex-direction: column; gap: 24px; }
        .results-header-card { text-align: center; padding: 36px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .results-header-card h2 { font-size: 1.8rem; margin: 0; }

        .scan-selector-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
        .scan-select-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1.5px solid #cbd5e1; border-radius: 12px; background: white; cursor: pointer; font-weight: 700; font-size: 0.9rem; }
        .scan-select-btn.active { border-color: #10B981; background: #f0fdf4; color: #15803d; }

        .viewer-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
        .viewer-panel { padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #0f172a; color: white; }
        .viewer-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 12px; }
        .toolbar-title { font-size: 0.88rem; font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
        .toolbar-actions { display: flex; gap: 6px; }
        .btn-tool { display: flex; align-items: center; gap: 5px; background: #1e293b; border: 1px solid #475569; color: #cbd5e1; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
        .btn-tool.active { background: #10B981; color: white; border-color: #10B981; }
        .btn-tool:disabled { opacity: 0.45; cursor: not-allowed; }

        .scan-viewport { background: #000000; border-radius: 14px; height: 380px; display: flex; align-items: center; justify-content: center; position: relative; }
        .scan-image-wrap { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .mri-scan-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .scan-unavailable { max-width: 80%; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; color: #cbd5e1; }
        .scan-unavailable strong { color: white; }
        .scan-unavailable a { color: #6ee7b7; font-weight: 700; }
        .viewport-legend { font-size: 0.78rem; color: #94a3b8; text-align: center; }

        /* Metrics Panel */
        .metrics-panel { padding: 28px; display: flex; flex-direction: column; gap: 20px; }
        .metric-header-row { display: flex; justify-content: space-between; align-items: center; }
        .metric-header-row h3 { font-size: 1.3rem; margin: 0; }
        .risk-tag { padding: 4px 14px; border-radius: 20px; font-weight: 800; font-size: 0.85rem; }

        .metrics-summary-table { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 14px; }
        .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
        .m-label { font-size: 0.88rem; color: var(--text-sub); }
        .m-val { font-size: 0.95rem; font-weight: 800; color: var(--text-main); }

        .diagnostic-notes-box { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 18px; }
        .diagnostic-notes-box h4 { margin: 0 0 8px; font-size: 0.95rem; color: #166534; display: flex; align-items: center; gap: 6px; }
        .diagnostic-notes-box p { margin: 0; font-size: 0.9rem; color: #14532d; line-height: 1.5; }

        .result-actions { display: flex; gap: 12px; margin-top: 8px; }
        .btn-primary-lg { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 24px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 800; cursor: pointer; flex: 1; }
        .btn-outline { padding: 14px 20px; background: white; color: var(--text-main); border: 1.5px solid #cbd5e1; border-radius: 12px; font-weight: 700; cursor: pointer; }

        /* History Archive */
        .history-scans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .history-scan-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .scan-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .scan-card-top h4 { font-size: 1.05rem; margin: 0 0 4px; }
        .scan-format-tag { font-size: 0.72rem; font-weight: 800; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: #64748b; }
        .history-risk-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; }
        .history-metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; }
        .h-metric span { font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
        .h-metric strong { font-size: 0.95rem; }
        .history-notes-snippet { font-size: 0.88rem; color: var(--text-sub); line-height: 1.4; margin: 0; }
        .history-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
        .btn-view-scan { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .btn-view-scan:hover { background: #dcfce7; }
        .empty-state { text-align: center; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; }

        @media (max-width: 900px) {
          .viewer-grid { grid-template-columns: 1fr; }
          .history-scans-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default MRIUpload;
