import ModuleCard from './ModuleCard';

interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
}

interface ModuleToggleListProps {
  modules: ModuleDefinition[];
  settings: any;
  onToggle: (id: string, checked: boolean) => void;
}

export default function ModuleToggleList({ modules, settings, onToggle }: ModuleToggleListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-stitch-panel border border-stitch-border rounded-xl p-8 max-w-3xl">
      <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2 mb-2">System Feature Flags</h3>
      <p className="text-sm text-stitch-muted mb-8">
        Toggle major functionalities on or off across your entire restaurant system instantly.
      </p>

      <div className="space-y-6">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            label={module.label}
            description={module.description}
            enabled={settings?.[module.id] || false}
            onToggle={(checked) => onToggle(module.id, checked)}
          />
        ))}
      </div>
    </div>
  );
}
