import React from 'react';

interface WireProps {
  id: string;
  d: string; // SVG Path data
  isActive: boolean;
  label?: string;
  value?: string | number;
  color?: string;
}

export const Wire: React.FC<WireProps> = ({ id, d, isActive, label, value, color = '#fbbf24' }) => {
  return (
    <g className="wire-group group">
      {/* Background/Base Wire */}
      <path
        d={d}
        fill="none"
        stroke="#334155" // Slate-700
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* Active Glowing Wire */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? "3" : "0"}
        strokeDasharray={isActive ? "10, 5" : "0"}
        className={`transition-all duration-300 ${isActive ? 'opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-dash-flow' : 'opacity-0'}`}
      />

      {/* Floating Label on Hover */}
      {label && (
        <foreignObject x="0" y="0" width="100%" height="100%" className="pointer-events-none overflow-visible">
           <div className="w-full h-full relative">
             {/* We can use offset-path logic here if we had more complex DOM handling, 
                 for now we rely on the path position visually or centralized labels. 
                 Instead, we place a tooltip that appears near the middle of the path if possible,
                 or we just rely on the parent container's hover.
             */}
           </div>
        </foreignObject>
      )}
      
      {/* Tooltip logic usually handled by parent coordinates, but we can attach a title */}
      <title>{isActive ? `${label}: ${value}` : label}</title>
      
      <style>{`
        @keyframes flow {
          to {
            stroke-dashoffset: -30; // Move particles
          }
        }
        .animate-dash-flow {
          animation: flow 1s linear infinite;
        }
      `}</style>
    </g>
  );
};
