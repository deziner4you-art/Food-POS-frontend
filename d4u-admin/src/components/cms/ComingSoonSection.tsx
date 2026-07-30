import type { ComponentType } from 'react';

interface ComingSoonSectionProps {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

// Shared placeholder for any CMS section with no backend yet — presentation
// only, no controls, no forms, no save buttons. Reuses the same dashed-card
// empty-state language as EmptyBannerState (Phase 2) rather than inventing
// a new visual pattern.
export default function ComingSoonSection({ title, description, icon: Icon }: ComingSoonSectionProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center text-center px-8 py-16 max-w-md w-full border border-dashed border-stitch-border rounded-2xl bg-stitch-panel">
        <div className="w-14 h-14 rounded-2xl bg-stitch-surface flex items-center justify-center text-stitch-muted mb-5">
          <Icon size={26} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold text-stitch-ink">{title}</h3>
          <span className="text-[0.6rem] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full bg-stitch-muted/20 text-stitch-muted">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-stitch-muted max-w-xs mb-4">{description}</p>
        <span className="text-[0.65rem] font-bold text-stitch-muted/70 uppercase tracking-wide">
          Backend not connected yet
        </span>
      </div>
    </div>
  );
}
