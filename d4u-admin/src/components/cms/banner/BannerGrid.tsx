import { useState } from 'react';
import type { DragEvent } from 'react';
import { LayoutTemplate, ImagePlus } from 'lucide-react';
import BannerCard from './BannerCard';
import EmptyBannerState from './EmptyBannerState';

interface BannerGridProps {
  banners: any[];
  loading: boolean;
  backendUrl: string;
  onAddClick: () => void;
  onEdit: (banner: any) => void;
  onDelete: (id: number) => void;
  onReorder: (reordered: any[]) => void;
}

export default function BannerGrid({
  banners,
  loading,
  backendUrl,
  onAddClick,
  onEdit,
  onDelete,
  onReorder,
}: BannerGridProps) {
  // Drag-reorder is a pure UI gesture — it only decides the new visual
  // order and hands it back via onReorder(); persisting displayOrder
  // through the existing PATCH endpoint stays in CmsManager.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onReorder(reordered);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
          <LayoutTemplate className="text-stitch-accent" /> Promotional Sliders
        </h3>
        {!loading && banners.length > 0 && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-stitch-accent hover:bg-stitch-accent-hover accent-glow-hover text-stitch-accent-ink px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <ImagePlus size={18} /> Add Banner
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-stitch-card border border-stitch-border rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-stitch-surface" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stitch-surface rounded w-2/3" />
                <div className="h-3 bg-stitch-surface rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptyBannerState onAddClick={onAddClick} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              imageSrc={`${backendUrl}${banner.imageUrl}`}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner.id)}
              draggable
              isDragging={dragIndex === index}
              isDropTarget={overIndex === index && dragIndex !== null && dragIndex !== index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                if (overIndex !== index) setOverIndex(index);
              }}
              onDrop={(e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
