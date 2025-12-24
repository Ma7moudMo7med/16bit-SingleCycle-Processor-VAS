import React from 'react';
import { ZoomIn } from 'lucide-react';

interface CpuComponentProps {
  title: string;
  isActive: boolean;
  value?: string | number;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  details?: React.ReactNode;
  type?: 'register' | 'logic' | 'memory' | 'control';
  onClick?: () => void;
  canZoom?: boolean;
}

export const CpuComponent: React.FC<CpuComponentProps> = ({ 
  title, 
  isActive, 
  value, 
  className = '', 
  children,
  icon,
  details,
  type = 'logic',
  onClick,
  canZoom = false
}) => {
  
  const getBorderColor = () => {
    if (isActive) return 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]';
    return 'border-slate-700 hover:border-slate-500';
  };

  const getBgColor = () => {
    if (isActive) return 'bg-slate-900/95';
    return 'bg-slate-900/80';
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center 
        border-2 rounded-xl backdrop-blur-md transition-all duration-300
        ${getBorderColor()} ${getBgColor()} ${className}
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        group
      `}
    >
      {/* Header / Title */}
      <div className={`
        absolute -top-3 px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase
        transition-colors duration-300 z-10
        ${isActive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 border border-slate-700'}
      `}>
        {title}
      </div>
      
      {/* Zoom Indicator */}
      {canZoom && (
        <div className="absolute top-2 right-2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={14} />
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 flex flex-col items-center space-y-2 w-full">
        {icon && (
          <div className={`transition-transform duration-500 ${isActive ? 'scale-110 text-amber-400' : 'text-slate-600'}`}>
            {icon}
          </div>
        )}
        
        {value !== undefined && (
          <div className="font-mono text-lg font-bold text-cyan-300 drop-shadow-md">
            {value}
          </div>
        )}

        {children}
      </div>

      {/* Detailed overlay on hover or active */}
      {isActive && details && (
        <div className="absolute -bottom-8 bg-black/90 text-amber-300 text-[10px] px-2 py-1 rounded border border-amber-900/50 whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {details}
        </div>
      )}
    </div>
  );
};