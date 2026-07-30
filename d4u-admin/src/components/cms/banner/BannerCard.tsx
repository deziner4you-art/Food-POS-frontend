import type { DragEvent } from 'react';
import { Trash2, Pencil, GripVertical } from 'lucide-react';

interface BannerCardProps {
  banner: any;
  imageSrc: string;
  onEdit: () => void;
  onDelete: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
}

export default function BannerCard({
  banner,
  imageSrc,
  onEdit,
  onDelete,
  draggable,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: BannerCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-stitch-card border rounded-xl overflow-hidden group transition-all duration-150 ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
      } ${isDropTarget ? 'border-stitch-accent border-dashed' : 'border-stitch-border'}`}
    >
      <div className="h-48 bg-stitch-surface relative overflow-hidden">
        <img
          src={imageSrc}
          alt={banner.title || 'Banner'}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        />
        <div
          className={`absolute top-2 left-2 text-[0.6rem] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full backdrop-blur ${
            banner.isActive ? 'bg-stitch-success/20 text-stitch-success' : 'bg-stitch-muted/20 text-stitch-muted'
          }`}
        >
          {banner.isActive ? 'Live' : 'Disabled'}
        </div>
        {draggable && (
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/40 backdrop-blur flex items-center justify-center text-stitch-ink cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to reorder"
            aria-hidden="true"
          >
            <GripVertical size={14} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-stitch-ink text-lg truncate">{banner.title || 'Untitled Banner'}</h4>
        <p className="text-sm text-stitch-muted mb-4 truncate">{banner.subtitle || 'No subtitle'}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono bg-stitch-surface px-2 py-1 rounded text-stitch-muted">
            Order: {banner.displayOrder}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-stitch-accent hover:text-stitch-accent-hover bg-stitch-accent/10 p-2 rounded-lg transition-colors"
              title="Edit banner"
              aria-label={`Edit banner: ${banner.title || 'Untitled Banner'}`}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              className="text-stitch-danger hover:text-stitch-danger/80 bg-stitch-danger/10 p-2 rounded-lg transition-colors"
              title="Delete banner"
              aria-label={`Delete banner: ${banner.title || 'Untitled Banner'}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
