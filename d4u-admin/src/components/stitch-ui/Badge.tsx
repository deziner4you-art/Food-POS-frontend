import type { HTMLAttributes, ReactNode } from 'react';

export type StitchBadgeVariant = 'accent' | 'success' | 'danger' | 'neutral';

export interface StitchBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StitchBadgeVariant;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<StitchBadgeVariant, string> = {
  accent: 'bg-stitch-accent text-stitch-accent-ink',
  success: 'bg-stitch-success/20 text-stitch-success border border-stitch-success/30',
  danger: 'bg-stitch-danger/20 text-stitch-danger border border-stitch-danger/30',
  neutral: 'bg-stitch-surface text-stitch-ink border border-stitch-border',
};

export function StitchBadge({
  variant = 'neutral',
  icon,
  className = '',
  children,
  ...rest
}: StitchBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full',
        VARIANT_CLASSES[variant],
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export default StitchBadge;
