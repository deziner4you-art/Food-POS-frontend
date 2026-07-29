import type { ReactNode } from 'react';

export interface StitchSectionHeadingProps {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}

export function StitchSectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  action,
  className = '',
}: StitchSectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between border-b border-stitch-border pb-4 ${className}`}>
      <div>
        {eyebrow && (
          <div className="text-xs text-stitch-accent font-bold uppercase tracking-wider flex items-center gap-1">
            {eyebrowIcon}
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stitch-ink font-display">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default StitchSectionHeading;
