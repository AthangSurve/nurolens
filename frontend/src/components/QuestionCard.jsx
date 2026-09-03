import React, { useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

const QuestionCard = ({
  question,
  section,
  options,
  onAnswer,
  selectedAnswer,
  image,
  accentColor = '#4A90E2'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="card question-card-modern">
      <div className="section-header">
        <span className="section-tag" style={{ background: `${accentColor}15`, color: accentColor }}>
          {section}
        </span>
      </div>

      <div className="question-content">
        <h2 className="question-text">{question}</h2>

        {image && (
          <div className="question-visual animate-fade-in">
            {typeof image === 'string' ? (
              <div className="image-frame">
                {!imageLoaded && !imageError && (
                  <div className="image-placeholder">
                    <ImageIcon size={48} className="animate-pulse" style={{ color: `${accentColor}40` }} />
                  </div>
                )}
                {imageError ? (
                  <div className="image-error">
                    <AlertCircle size={48} style={{ color: '#ef4444' }} />
                    <span>Visual stimulus unavailable</span>
                  </div>
                ) : (
                  <img
                    src={image}
                    alt="Clinical visual stimuli"
                    className={`clinical-img ${imageLoaded ? 'loaded' : 'hidden'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      console.error("Clinical image failed to load:", image);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="svg-stimuli">{image}</div>
            )}
          </div>
        )}
      </div>

      <div className="options-grid">
        {options.map((option, index) => (
          <button
            key={index}
            className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
            onClick={() => onAnswer(option)}
            style={{ '--accent-local': accentColor }}
          >
            <span className="option-label">{String.fromCharCode(65 + index)}</span>
            <span className="option-value">{option}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .question-card-modern {
          padding: 48px;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          animation: fadeIn 0.4s ease-out;
        }
        .section-header { margin-bottom: 24px; }
        .section-tag {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .question-visual { 
          margin-bottom: 40px;
          display: flex;
          justify-content: center;
          min-height: 200px;
          align-items: center;
        }
        .image-frame {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .image-placeholder, .image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .clinical-img { 
          max-height: 260px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          object-fit: contain;
          transition: opacity 0.3s ease-in;
        }
        .clinical-img.hidden { opacity: 0; position: absolute; }
        .clinical-img.loaded { opacity: 1; }

        .question-text {
          font-size: 2rem;
          line-height: 1.3;
          margin-bottom: 40px;
          color: var(--text-main);
          font-weight: 700;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: auto;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          border: 2px solid #f1f5f9;
          background: white;
          border-radius: 16px;
          text-align: left;
          transition: all 0.2s;
          cursor: pointer;
        }
        .option-btn:hover {
          border-color: var(--accent-local);
          background: #f8fbff;
          transform: translateY(-2px);
        }
        .option-btn.selected {
          border-color: var(--accent-local);
          background: #f0f7ff;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .option-label {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #94a3b8;
          flex-shrink: 0;
        }
        .option-btn.selected .option-label {
          background: var(--accent-local);
          color: white;
        }
        .option-value {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-main);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .options-grid { grid-template-columns: 1fr; }
          .question-text { font-size: 1.5rem; }
          .option-btn { padding: 16px; }
        }
      `}</style>
    </div>
  );
};

export default QuestionCard;
