import React from 'react';

const DashboardCard = ({ children, title, subtitle, className = '' }) => {
    return (
        <div className={`card ${className}`}>
            {(title || subtitle) && (
                <div className="card-header-basic mb-4">
                    {title && <h3>{title}</h3>}
                    {subtitle && <p className="text-secondary text-sm">{subtitle}</p>}
                </div>
            )}
            {children}
            <style jsx>{`
        .card-header-basic h3 {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        .text-sm {
          font-size: 0.85rem;
        }
      `}</style>
        </div>
    );
};

export default DashboardCard;
