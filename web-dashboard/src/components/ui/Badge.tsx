import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'alert' | 'info' | 'neutral';
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  pulse = false,
  icon,
}) => {
  const variantStyles = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    alert: 'bg-premium-alert/20 text-premium-alert border-premium-alert/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${
        variantStyles[variant]
      } ${pulse ? 'alert-badge-pulse' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
