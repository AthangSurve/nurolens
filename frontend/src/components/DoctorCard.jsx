import React from 'react';
import { Star, MapPin, Calendar, ShieldCheck } from 'lucide-react';

const DoctorCard = ({ doctor }) => {
    return (
        <div className="card doctor-card-horizontal">
            <div className="doctor-img-container">
                <img src={doctor.image} alt={doctor.name} className="doctor-img" />
                <div className="verified-badge">
                    <ShieldCheck size={14} />
                </div>
            </div>
            <div className="doctor-info-main">
                <div className="info-header">
                    <div>
                        <h3>{doctor.name}</h3>
                        <span className="specialty">{doctor.specialty}</span>
                    </div>
                    <div className="rating">
                        <Star size={16} fill="#F1C40F" color="#F1C40F" />
                        <strong>{doctor.rating}</strong>
                        <span>({doctor.reviews} reviews)</span>
                    </div>
                </div>

                <div className="info-meta">
                    <div className="meta-item"><MapPin size={16} /> {doctor.location}</div>
                    <div className="meta-item availability"><Calendar size={16} /> {doctor.availability}</div>
                </div>

                <div className="doctor-actions">
                    <button className="btn-primary">Book Now</button>
                    <button className="btn-outline-sm">Profile</button>
                </div>
            </div>
            <style jsx>{`
        .doctor-card-horizontal {
          display: flex;
          gap: 20px;
          padding: 20px;
          margin-bottom: 15px;
        }
        .doctor-img-container { position: relative; }
        .doctor-img {
          width: 100px;
          height: 100px;
          border-radius: 12px;
          object-fit: cover;
        }
        .verified-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: var(--primary);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        .doctor-info-main { flex: 1; }
        .info-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .specialty { color: var(--primary); font-weight: 600; font-size: 0.85rem; }
        .rating { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; }
        .info-meta { display: flex; gap: 15px; margin-bottom: 15px; }
        .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--text-secondary); }
        .availability { color: var(--success); font-weight: 500; }
        .doctor-actions { display: flex; gap: 10px; }
        .btn-outline-sm {
          border: 1px solid var(--border-color);
          background: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
      `}</style>
        </div>
    );
};

export default DoctorCard;
