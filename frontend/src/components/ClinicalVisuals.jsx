import React from 'react';

export const OverlappingPentagons = () => (
    <svg width="200" height="150" viewBox="0 0 200 150">
        <polygon points="60,20 100,20 120,60 80,100 40,60" fill="none" stroke="black" strokeWidth="2" />
        <polygon points="90,50 130,50 150,90 110,130 70,90" fill="none" stroke="black" strokeWidth="2" />
    </svg>
);

export const CalendarVisual = () => (
    <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="calHeader" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="calShadow" x="0" y="4" width="180" height="146" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
            </filter>
        </defs>
        {/* Main Calendar Body */}
        <rect x="15" y="20" width="150" height="116" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" filter="url(#calShadow)" />
        {/* Calendar Header */}
        <path d="M15 32C15 25.3726 20.3726 20 27 20H153C159.627 20 165 25.3726 165 32V44H15V32Z" fill="url(#calHeader)" />
        {/* Rings */}
        <rect x="45" y="10" width="6" height="16" rx="3" fill="#64748B" />
        <rect x="129" y="10" width="6" height="16" rx="3" fill="#64748B" />
        {/* Header Indicator */}
        <circle cx="80" cy="32" r="3" fill="#BFDBFE" />
        <circle cx="90" cy="32" r="3" fill="#BFDBFE" />
        <circle cx="100" cy="32" r="3" fill="#BFDBFE" />
        {/* Grid Cells */}
        <rect x="30" y="56" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="56" y="56" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="82" y="56" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="108" y="56" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="134" y="56" width="18" height="12" rx="3" fill="#F1F5F9" />

        <rect x="30" y="74" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="56" y="74" width="18" height="12" rx="3" fill="#3B82F6" />
        <rect x="82" y="74" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="108" y="74" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="134" y="74" width="18" height="12" rx="3" fill="#F1F5F9" />

        <rect x="30" y="92" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="56" y="92" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="82" y="92" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="108" y="92" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="134" y="92" width="18" height="12" rx="3" fill="#F1F5F9" />

        <rect x="30" y="110" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="56" y="110" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="82" y="110" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="108" y="110" width="18" height="12" rx="3" fill="#F1F5F9" />
        <rect x="134" y="110" width="18" height="12" rx="3" fill="#F1F5F9" />
    </svg>
);
