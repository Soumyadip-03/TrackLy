import React from 'react';

interface CalendarLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const CalendarLogo: React.FC<CalendarLogoProps> = ({ 
  width = 200, 
  height = 200,
  className = ''
}) => {
  return (
    <div className={className} style={{ width, height }}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {/* Circular Background */}
        <circle cx="100" cy="100" r="95" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2">
          <animate attributeName="fill" values="#f8fafc;#f1f5f9;#f8fafc" dur="5s" repeatCount="indefinite" />
        </circle>
        
        {/* Calendar Base (Zoomed and Centered) */}
        <rect x="50" y="45" width="100" height="110" rx="10" ry="10" fill="#4f46e5" stroke="#2563eb" strokeWidth="3">
          <animate attributeName="fill" values="#4f46e5;#6366f1;#4f46e5" dur="3s" repeatCount="indefinite" />
        </rect>
        
        {/* Calendar Top Bar */}
        <rect x="50" y="45" width="100" height="22" rx="10" ry="10" fill="#2563eb" stroke="#2563eb" strokeWidth="1">
          <animate attributeName="fill" values="#2563eb;#3b82f6;#2563eb" dur="3s" repeatCount="indefinite" />
        </rect>
        
        {/* Calendar Hangers */}
        <rect x="70" y="35" width="8" height="12" rx="3" ry="3" fill="#1e40af" />
        <rect x="122" y="35" width="8" height="12" rx="3" ry="3" fill="#1e40af" />
        
        {/* Calendar Grid Lines */}
        <line x1="50" y1="75" x2="150" y2="75" stroke="white" strokeWidth="2" />
        <line x1="83" y1="75" x2="83" y2="155" stroke="white" strokeWidth="2" />
        <line x1="117" y1="75" x2="117" y2="155" stroke="white" strokeWidth="2" />
        <line x1="50" y1="102" x2="150" y2="102" stroke="white" strokeWidth="2" />
        <line x1="50" y1="129" x2="150" y2="129" stroke="white" strokeWidth="2" />
        
        {/* Calendar Title */}
        <text x="100" y="61" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" textAnchor="middle" fill="white">TrackLy</text>
        
        {/* Animated Checkmark */}
        <g>
          <path d="M65 89 L72 96 L85 83" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M65 115 L72 122 L85 109" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
          </path>
          <path d="M65 142 L72 149 L85 136" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
          </path>
        </g>
        
        {/* Animated Numbers */}
        <text x="100" y="92" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
          26
        </text>
        <text x="134" y="92" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          27
        </text>
        <text x="100" y="119" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="1s" repeatCount="indefinite" />
          28
        </text>
        <text x="134" y="119" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="1;0.5;1" dur="3s" begin="1s" repeatCount="indefinite" />
          29
        </text>
        <text x="100" y="146" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="1;0.5;1" dur="3s" begin="2s" repeatCount="indefinite" />
          30
        </text>
        <text x="134" y="146" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="2s" repeatCount="indefinite" />
          31
        </text>
      </svg>
    </div>
  );
};

export default CalendarLogo;
