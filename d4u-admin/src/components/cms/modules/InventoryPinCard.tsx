import { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface InventoryPinCardProps {
  hasPin: boolean;
  onSave: (pin: string) => Promise<boolean>;
}

// A separate, per-branch section — not a ModuleCard item — since a secret
// PIN is a different kind of setting than a boolean feature flag and
// deserves its own visual weight, matching ModuleToggleList's own panel.
export default function InventoryPinCard({ hasPin, onSave }: InventoryPinCardProps) {
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = async () => {
    if (!pin) return;
    setSaving(true);
    setSavedMsg('');
    const ok = await onSave(pin);
    setSaving(false);
    if (ok) {
      setSavedMsg('PIN updated successfully.');
      setPin('');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  return (
    <div className="flex-1 bg-stitch-panel border border-stitch-border rounded-xl p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
          <ShieldCheck className="text-stitch-accent" /> KDS Inventory Unlock PIN
        </h3>
        <span
          className={`text-[0.6rem] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full ${
            hasPin ? 'bg-stitch-success/20 text-stitch-success' : 'bg-stitch-muted/20 text-stitch-muted'
          }`}
        >
          {hasPin ? 'Set' : 'Not Set'}
        </span>
      </div>
      <p className="text-sm text-stitch-muted mb-6">
        Lets any manager at this branch unlock the Inventory tab on the Kitchen Display — separate from
        individual Chef PINs, which only log a chef into the station itself.
      </p>

      <div className="flex gap-3 max-w-md">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={hasPin ? 'Enter a new PIN to change it' : 'Set a PIN'}
          className="flex-1 bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2.5 text-stitch-ink text-sm focus:outline-none focus:border-stitch-accent"
        />
        <button
          onClick={handleSave}
          disabled={!pin || saving}
          className="px-5 py-2.5 rounded-lg font-bold text-sm bg-stitch-accent text-stitch-accent-ink hover:bg-stitch-accent-hover accent-glow-hover disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save PIN'}
        </button>
      </div>
      {savedMsg && (
        <p className="text-xs text-stitch-success mt-3 flex items-center gap-1">
          <Check size={12} /> {savedMsg}
        </p>
      )}
    </div>
  );
}
