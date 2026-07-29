import type { HTMLAttributes } from 'react';

export type StitchCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface StitchCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
  padding?: StitchCardPadding;
}

const PADDING_CLASSES: Record<StitchCardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function StitchCard({
  hoverGlow = false,
  padding = 'md',
  className = '',
  children,
  ...rest
}: StitchCardProps) {
  return (
    <div
      className={[
        'bg-stitch-card border border-stitch-border rounded-2xl shadow-xl',
        PADDING_CLASSES[padding],
        hoverGlow ? 'accent-glow-hover transition-all duration-300' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export default StitchCard;
