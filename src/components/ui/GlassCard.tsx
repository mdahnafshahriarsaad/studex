import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glowOnHover = true,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden transition-all duration-300',
          glowOnHover && 'hover:border-electric-500/40 hover:shadow-glow-sm',
          interactive && 'cursor-pointer active:scale-[0.98]',
          className
        )
      )}
      {...props}
    >
      {/* Top light reflection beam (Liquid Glass depth effect) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      {/* Bottom edge highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
