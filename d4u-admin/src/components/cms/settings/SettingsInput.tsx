interface SettingsInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'number';
  placeholder?: string;
  error?: string;
}

export default function SettingsInput({ label, value, onChange, type = 'text', placeholder, error }: SettingsInputProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-stitch-muted mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-stitch-surface border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent ${
          error ? 'border-stitch-danger' : 'border-stitch-border'
        }`}
      />
      {error && <p className="text-xs text-stitch-danger mt-1">{error}</p>}
    </div>
  );
}
