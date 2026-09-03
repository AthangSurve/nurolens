import React from 'react';

const ProgressBar = ({ progress, color = 'var(--primary)' }) => {
    return (
        <div className="progress-container">
            <div
                className="progress-bar-fill"
                style={{ width: `${progress}%`, backgroundColor: color }}
            ></div>
            <style jsx>{`
        .progress-container {
          width: 100%;
          height: 8px;
          background: #eef2f6;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
      `}</style>
        </div>
    );
};

export default ProgressBar;
