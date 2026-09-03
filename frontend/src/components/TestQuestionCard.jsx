import React from 'react';

const TestQuestionCard = ({ question, onScore, currentScore }) => {
    return (
        <div className="card question-card-inner">
            <div className="section-label">{question.section}</div>
            <h2 className="question-text">{question.text}</h2>

            <div className="scoring-area">
                <p>Assign Points (0 to {question.points})</p>
                <div className="score-row">
                    {Array.from({ length: question.points + 1 }).map((_, i) => (
                        <button
                            key={i}
                            className={`score-select-btn ${currentScore === i ? 'selected' : ''}`}
                            onClick={() => onScore(i)}
                        >
                            {i}
                        </button>
                    ))}
                </div>
            </div>
            <style jsx>{`
        .question-card-inner { padding: 30px; }
        .section-label { color: var(--primary); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; }
        .question-text { font-size: 1.5rem; margin-bottom: 30px; }
        .score-row { display: flex; gap: 10px; }
        .score-select-btn {
          width: 44px; height: 44px; border-radius: 8px; border: 1px solid var(--border-color);
          background: white; font-weight: 600; cursor: pointer;
        }
        .score-select-btn.selected { background: var(--primary); color: white; border-color: var(--primary); }
      `}</style>
        </div>
    );
};

export default TestQuestionCard;
