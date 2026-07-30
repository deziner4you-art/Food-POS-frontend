import { LayoutTemplate, ImagePlus } from 'lucide-react';

interface EmptyBannerStateProps {
  onAddClick: () => void;
}

export default function EmptyBannerState({ onAddClick }: EmptyBannerStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center p-16 border border-dashed border-stitch-border rounded-xl text-stitch-muted">
      <LayoutTemplate size={40} className="mb-4 opacity-30" />
      <h4 className="text-stitch-ink font-bold mb-1">No banners yet</h4>
      <p className="text-sm text-stitch-muted mb-6 max-w-xs">
        Add a hero banner to feature promotions on your homepage.
      </p>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 bg-stitch-accent hover:bg-stitch-accent-hover accent-glow-hover text-stitch-accent-ink px-4 py-2 rounded-lg font-bold transition-colors"
      >
        <ImagePlus size={18} /> Add Banner
      </button>
    </div>
  );
}
