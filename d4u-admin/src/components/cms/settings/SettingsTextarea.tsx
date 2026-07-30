interface SettingsTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  error?: string;
}

export default function SettingsTextarea({ label, value, onChange, rows = 3, placeholder, error }: SettingsTextareaProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-stitch-muted mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full bg-stitch-surface border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent custom-scrollbar ${
          error ? 'border-stitch-danger' : 'border-stitch-border'
        }`}
      />
      {error && <p className="text-xs text-stitch-danger mt-1">{error}</p>}
    </div>
  );
}
