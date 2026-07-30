import ModuleStatusBadge from './ModuleStatusBadge';

interface ModuleCardProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
}

export default function ModuleCard({ label, description, enabled, onToggle }: ModuleCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-stitch-surface border border-stitch-border rounded-xl hover:border-stitch-accent/40 transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-stitch-ink">{label}</h4>
          <ModuleStatusBadge enabled={enabled} />
        </div>
        <p className="text-xs text-stitch-muted">{description}</p>
      </div>
      {/* Reused verbatim from the pre-existing Modules toggle markup — same
          classes, same peer/after structure, only the checked/onChange
          source moved to props. */}
      <label className="relative inline-flex items-center cursor-pointer flex-none">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <div className="w-11 h-6 bg-stitch-muted/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-stitch-ink after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stitch-ink after:border-stitch-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stitch-accent"></div>
      </label>
    </div>
  );
}
