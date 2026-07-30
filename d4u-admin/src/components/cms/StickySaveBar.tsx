import { Save, CheckCircle } from 'lucide-react';

interface StickySaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  successMsg?: string;
  onSave: (e: any) => void;
}

export default function StickySaveBar({ isDirty, isSaving, successMsg, onSave }: StickySaveBarProps) {
  if (!isDirty && !successMsg) return null;

  const showingSuccess = !!successMsg && !isDirty;

  return (
    <div
      className={`sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3 rounded-xl mb-6 border animate-fade-in ${
        showingSuccess ? 'bg-stitch-success/10 border-stitch-success/40' : 'bg-stitch-panel border-stitch-accent'
      }`}
    >
      {showingSuccess ? (
        <span className="flex items-center gap-2 text-sm font-bold text-stitch-success">
          <CheckCircle size={16} /> {successMsg}
        </span>
      ) : (
        <span className="flex items-center gap-2 text-sm font-bold text-stitch-ink">
          <span className="w-2 h-2 rounded-full bg-stitch-accent" /> You have unsaved changes
        </span>
      )}

      {isDirty && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-stitch-success hover:bg-stitch-success/80 text-stitch-ink px-5 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      )}
    </div>
  );
}
