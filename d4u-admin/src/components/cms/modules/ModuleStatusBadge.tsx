interface ModuleStatusBadgeProps {
  enabled: boolean;
}

export default function ModuleStatusBadge({ enabled }: ModuleStatusBadgeProps) {
  return (
    <span
      className={`text-[0.6rem] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full ${
        enabled ? 'bg-stitch-success/20 text-stitch-success' : 'bg-stitch-muted/20 text-stitch-muted'
      }`}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}
