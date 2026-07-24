import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 transition-all duration-300 ${
        hoverEffect ? 'hover:bg-white/5 hover:border-white/15 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
