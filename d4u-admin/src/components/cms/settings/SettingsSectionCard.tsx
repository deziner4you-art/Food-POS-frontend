import type { ReactNode, ComponentType } from 'react';

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
}

export default function SettingsSectionCard({ title, description, icon: Icon, children }: SettingsSectionCardProps) {
  return (
    <div className="bg-stitch-panel border border-stitch-border rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-stitch-ink flex items-center gap-2">
          {Icon && <Icon size={20} className="text-stitch-accent" />} {title}
        </h3>
        {description && <p className="text-sm text-stitch-muted mt-1">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
