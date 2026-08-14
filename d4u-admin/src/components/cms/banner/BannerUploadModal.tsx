import { useEffect } from 'react';
import type { ChangeEvent, FormEvent, RefObject } from 'react';

interface BannerFormState {
  title: string;
  subtitle: string;
  linkUrl: string;
  buttonText: string;
  isActive: boolean;
  displayOrder: number;
}

interface BannerUploadModalProps {
  mode: 'create' | 'edit';
  bannerForm: BannerFormState;
  setBannerForm: (form: BannerFormState) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  bannerPreview: string | null;
  setBannerPreview: (preview: string | null) => void;
  existingImageSrc?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  targetStoreIds: number[];
  setTargetStoreIds: (ids: number[]) => void;
  branches: { id: number; name: string }[];
}

export default function BannerUploadModal({
  mode,
  bannerForm,
  setBannerForm,
  selectedFile,
  setSelectedFile,
  bannerPreview,
  setBannerPreview,
  existingImageSrc,
  fileInputRef,
  onClose,
  onSubmit,
  targetStoreIds,
  setTargetStoreIds,
  branches,
}: BannerUploadModalProps) {
  const isEdit = mode === 'edit';

  // Accessibility polish only — presentation/keyboard behavior, no change
  // to what create/edit actually does.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-stitch-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="glass-panel rounded-2xl p-6 w-full max-w-md animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
      >
        <h3 id="banner-modal-title" className="text-xl font-bold text-stitch-ink mb-4">
          {isEdit ? 'Edit Banner' : 'Upload Banner'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {isEdit ? (
            <div>
              <label className="block text-xs font-bold text-stitch-muted mb-1">Banner Image</label>
              <div className="rounded-xl overflow-hidden border border-stitch-border">
                <img
                  src={bannerPreview || existingImageSrc}
                  alt={bannerForm.title || 'Banner'}
                  className="w-full h-auto object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setBannerPreview(null);
                  }
                }}
                className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-2 text-stitch-ink file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stitch-accent/10 file:text-stitch-accent hover:file:bg-stitch-accent/20 mt-2"
              />
              <p className="text-xs text-stitch-muted mt-2">
                {selectedFile ? 'New image selected — will replace the current one on save.' : 'Upload a new image to replace the current one, or leave blank to keep it.'}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-stitch-muted mb-1">Banner Image (16:9 Recommended)</label>
              <input
                required
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setBannerPreview(null);
                  }
                }}
                className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-2 text-stitch-ink file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stitch-accent/10 file:text-stitch-accent hover:file:bg-stitch-accent/20"
              />
              {bannerPreview && (
                <div className="mt-4 rounded-xl overflow-hidden border border-stitch-border">
                  <img src={bannerPreview} alt="Preview" className="w-full h-auto object-cover" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stitch-muted mb-1">Title (Optional)</label>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stitch-muted mb-1">Subtitle (Optional)</label>
            <input
              type="text"
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-stitch-surface border border-stitch-border rounded-lg">
              <span className="text-sm font-bold text-stitch-ink">Active on website</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  aria-label="Active on website"
                />
                <div className="w-11 h-6 bg-stitch-muted/30 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-stitch-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-stitch-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-stitch-ink after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stitch-ink after:border-stitch-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stitch-accent"></div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Show On Branches</label>
            <div className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-2 text-stitch-ink max-h-40 overflow-y-auto flex flex-col gap-1">
              {branches.length === 0 ? (
                <span className="text-sm text-stitch-muted">No branches found.</span>
              ) : branches.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-stitch-card">
                  <input
                    type="checkbox"
                    checked={targetStoreIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setTargetStoreIds([...targetStoreIds, s.id]);
                      else setTargetStoreIds(targetStoreIds.filter((id) => id !== s.id));
                    }}
                    className="accent-stitch-accent"
                  />
                  <span className="text-sm font-bold">{s.name}</span>
                </label>
              ))}
            </div>
            {targetStoreIds.length === 0 ? (
              <p className="text-[11px] text-amber-400 mt-2 font-bold">⚠ No branch selected — this banner will show on EVERY branch of this brand.</p>
            ) : (
              <p className="text-[11px] text-stitch-muted mt-2 font-medium">This banner will only show on the selected branch(es).</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-bold text-stitch-muted bg-stitch-surface hover:bg-stitch-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg font-bold text-stitch-accent-ink bg-stitch-accent hover:bg-stitch-accent-hover accent-glow-hover"
            >
              {isEdit ? 'Save Changes' : 'Upload & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
