import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'electric' | 'glass' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'electric',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    electric: 'bg-electric-500/15 text-electric-400 border border-electric-500/30 shadow-glow-sm',
    glass: 'bg-white/5 text-neutral-300 border border-white/10',
    neutral: 'bg-neutral-800 text-neutral-400',
    accent: 'bg-white text-black font-semibold',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};
