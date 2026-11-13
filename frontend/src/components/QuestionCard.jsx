import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, AlertCircle, Check, ArrowRight } from 'lucide-react';

const QuestionCard = ({
  question,
  section,
  domain,
  options = [],
  onSelect,
  onConfirmNext,
  selectedAnswer,
  image,
  isLast = false,
  accentColor = '#4A90E2',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);

  // Normalize image paths (ensure leading slash for local public assets)
  const normalizedImage = typeof image === 'string' && !image.startsWith('http') && !image.startsWith('/')
    ? `/${image}`
    : image;

  // Check if image is already cached or loaded
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [normalizedImage, question]);

  // Keyboard shortcut listener (keys 1-4 or A-D to select, Enter to advance)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (['1', 'A'].includes(key) && options[0]) onSelect(options[0]);
      if (['2', 'B'].includes(key) && options[1]) onSelect(options[1]);
      if (['3', 'C'].includes(key) && options[2]) onSelect(options[2]);
      if (['4', 'D'].includes(key) && options[3]) onSelect(options[3]);
      if (e.key === 'Enter' && selectedAnswer && onConfirmNext) {
        onConfirmNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, selectedAnswer, onSelect, onConfirmNext]);

  return (
    <div className="card question-card-modern">
      {/* Header tags */}
      <div className="section-header">
        <span className="section-tag" style={{ background: `${accentColor}18`, color: accentColor }}>
          {section}
        </span>
        {domain && (
          <span className="domain-pill">
            Domain: {domain}
          </span>
        )}
      </div>

      <div className="question-content">
        <h2 className="question-text">{question}</h2>

        {image && (
          <div className="question-visual animate-fade-in">
            {typeof image === 'string' ? (
              <div className="image-frame">
                {!imageLoaded && !imageError && (
                  <div className="image-placeholder">
                    <ImageIcon size={44} className="animate-pulse" style={{ color: `${accentColor}60` }} />
                    <span>Loading visual stimuli...</span>
                  </div>
                )}
                <img
                  ref={imgRef}
                  key={normalizedImage}
                  src={normalizedImage}
                  alt="Clinical visual stimuli"
                  className={`clinical-img ${imageLoaded ? 'loaded' : 'hidden'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true); // reveal fallback container
                  }}
                />
                {imageError && (
                  <div className="image-fallback-badge">
                    <AlertCircle size={18} color="#f59e0b" />
                    <span>Visual Stimulus (Reference: {section})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="svg-stimuli">{image}</div>
            )}
          </div>
        )}
      </div>

      {/* Options grid */}
      <div className="options-grid">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={`${index}-${option}`}
              type="button"
              className={`option-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(option)}
              style={{ '--accent-local': accentColor }}
            >
              <span className="option-label">{String.fromCharCode(65 + index)}</span>
              <span className="option-value">{option}</span>
              {isSelected && (
                <span className="check-indicator" style={{ background: accentColor }}>
                  <Check size={14} color="#ffffff" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Confirmation Action Bar */}
      <div className="confirm-action-bar">
        <div className="selected-hint">
          {selectedAnswer ? (
            <span className="selected-active-text">
              Selected: <strong>{selectedAnswer}</strong>
            </span>
          ) : (
            <span className="select-prompt-text">
              Please choose an option above to proceed
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-confirm-next"
          disabled={!selectedAnswer}
          onClick={onConfirmNext}
          style={{ background: selectedAnswer ? accentColor : '#cbd5e1' }}
        >
          <span>{isLast ? 'Complete Assessment' : 'Next Question'}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <style jsx>{`
        .question-card-modern {
          padding: 44px;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          animation: fadeIn 0.3s ease-out;
          border: 1px solid #edf2f7;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .section-tag {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .domain-pill {
          padding: 5px 12px;
          border-radius: 20px;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .question-visual { 
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
          min-height: 180px;
          align-items: center;
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }
        .image-frame {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 160px;
        }
        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .clinical-img { 
          max-height: 240px;
          max-width: 100%;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          object-fit: contain;
          transition: opacity 0.25s ease-in;
        }
        .clinical-img.hidden { opacity: 0; position: absolute; }
        .clinical-img.loaded { opacity: 1; }

        .image-fallback-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .svg-stimuli {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .question-text {
          font-size: 1.65rem;
          line-height: 1.35;
          margin-bottom: 28px;
          color: var(--text-main, #1e293b);
          font-weight: 700;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: auto;
          margin-bottom: 28px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 16px;
          text-align: left;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }
        .option-btn:hover {
          border-color: var(--accent-local);
          background: #f8fbff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .option-btn.selected {
          border-color: var(--accent-local);
          background: #f0f7ff;
          box-shadow: 0 4px 16px rgba(74,144,226,0.12);
        }
        .option-label {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #64748b;
          flex-shrink: 0;
          font-size: 0.9rem;
        }
        .option-btn.selected .option-label {
          background: var(--accent-local);
          color: white;
        }
        .option-value {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-main, #1e293b);
          flex: 1;
        }
        .check-indicator {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Action footer */
        .confirm-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          gap: 16px;
          flex-wrap: wrap;
        }
        .selected-hint {
          font-size: 0.9rem;
        }
        .selected-active-text {
          color: #0f172a;
          font-weight: 500;
        }
        .selected-active-text strong {
          color: var(--accent-local);
          font-weight: 800;
        }
        .select-prompt-text {
          color: #94a3b8;
          font-style: italic;
        }

        .btn-confirm-next {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }
        .btn-confirm-next:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }
        .btn-confirm-next:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .question-card-modern { padding: 24px 20px; }
          .options-grid { grid-template-columns: 1fr; }
          .question-text { font-size: 1.35rem; }
          .confirm-action-bar { flex-direction: column; align-items: stretch; }
          .btn-confirm-next { justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default QuestionCard;
