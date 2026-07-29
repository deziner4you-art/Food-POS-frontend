import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type StitchButtonVariant = 'primary' | 'secondary' | 'ghost';
export type StitchButtonSize = 'sm' | 'md' | 'lg';

export interface StitchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: StitchButtonVariant;
  size?: StitchButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<StitchButtonVariant, string> = {
  primary: 'bg-stitch-accent text-stitch-accent-ink font-extrabold hover:bg-stitch-accent-hover accent-glow',
  secondary: 'bg-stitch-surface border border-stitch-border text-stitch-ink font-bold hover:border-stitch-accent/50',
  ghost: 'bg-transparent border border-stitch-border text-stitch-ink font-semibold hover:bg-stitch-surface',
};

const SIZE_CLASSES: Record<StitchButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-xs px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-sm px-8 py-4 rounded-xl gap-2',
};

export function StitchButton({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  children,
  ...rest
}: StitchButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export default StitchButton;
