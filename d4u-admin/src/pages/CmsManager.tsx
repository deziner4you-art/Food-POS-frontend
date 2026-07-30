import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, ImagePlus, Trash2, Globe } from 'lucide-react';
import { customAlert, customConfirm } from '../utils/alerts';
import { useAdminContext } from '../context/AdminContext';
import CmsShell from '../components/cms/CmsShell';
import type { CmsTab } from '../components/cms/CmsSectionNav';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function CmsManager() {
  const { branches, brands, selectedBranchId, setSelectedBranchId, activeBrandId } = useAdminContext();

  const [activeTab, setActiveTab] = useState<CmsTab>('BANNERS');
  // Snapshot of the last-fetched/last-saved settings, used only to derive
  // isDirty for the sticky save bar — a ref (not state) so it never triggers
  // its own re-render; the render already happens when `settings` changes.
  const settingsSnapshotRef = useRef<any>(null);

  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', linkUrl: '', buttonText: '', isActive: true, displayOrder: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings & Modules State
  const [settings, setSettings] = useState<any>({ 
    siteTitle: '', contactPhone: '', contactEmail: '', address: '', googleMapUrl: '',
    facebookUrl: '', instagramUrl: '', whatsappNumber: '',
    twitterUrl: '', youtubeUrl: '', tiktokUrl: '', linkedinUrl: '', pinterestUrl: '', threadsUrl: '',
    module_auth_enabled: false, module_kds_enabled: true, module_loyalty_enabled: false, module_payments_enabled: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cms/banners`);
      if (res.ok) setBanners(await res.json());
    } catch (e) {
      console.error('Failed to fetch banners', e);
    }
  };

  const fetchSettings = async () => {
    if (!selectedBranchId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        settingsSnapshotRef.current = data;
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  // activeBrandId is now derived in AdminContext

  useEffect(() => {
    if (selectedBranchId) {
      fetchBanners();
      fetchSettings();
    }
  }, [selectedBranchId]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedBranchId(id);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return customAlert('Please select an image file first.');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', bannerForm.title);
    formData.append('subtitle', bannerForm.subtitle);
    formData.append('linkUrl', bannerForm.linkUrl);
    formData.append('buttonText', bannerForm.buttonText);
    formData.append('isActive', String(bannerForm.isActive));
    formData.append('displayOrder', String(bannerForm.displayOrder));
    formData.append('brand_id', '1');

    try {
      const res = await fetch(`${BACKEND_URL}/cms/banners`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowBannerModal(false);
        setBannerForm({ title: '', subtitle: '', linkUrl: '', buttonText: '', isActive: true, displayOrder: 0 });
        setSelectedFile(null);
        fetchBanners();
      }
    } catch (e) {
      console.error('Failed to create banner', e);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!(await customConfirm('Delete this banner?'))) return;
    try {
      await fetch(`${BACKEND_URL}/cms/banners/${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (e) {
      console.error('Failed to delete banner', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return customAlert("Please select a branch first.");
    setIsSavingSettings(true);
    try {
      // Remove Prisma relations and read-only fields before sending
      const { id, brand_id, store_id, updatedAt, brand, store, ...cleanSettings } = settings;
      
      const res = await fetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanSettings)
      });
      if (res.ok) {
        settingsSnapshotRef.current = cleanSettings;
        setSuccessMsg('Settings Saved Successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    setIsSavingSettings(false);
  };

  // Dirty flag for the sticky save bar — derived at render time from the
  // ref snapshot above, not stored as its own state.
  const isDirty = JSON.stringify(settings) !== JSON.stringify(settingsSnapshotRef.current);

  const branchSelector = (
    <div className="bg-stitch-panel px-4 py-2 rounded-xl flex items-center gap-2 border border-stitch-border">
      <span className="text-stitch-muted font-bold text-sm">Branch:</span>
      <select
        value={selectedBranchId || 0}
        onChange={handleBranchChange}
        className="bg-stitch-panel text-stitch-ink outline-none font-bold"
      >
        <option value={0} className="bg-stitch-panel text-stitch-ink">All Branches (Global)</option>
        {(activeBrandId ? brands.find(b => b.id === activeBrandId)?.stores || [] : branches).map(b => (
          <option key={b.id} value={b.id} className="bg-stitch-panel text-stitch-ink">{b.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <CmsShell
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      branchSelector={branchSelector}
      isDirty={isDirty}
      isSaving={isSavingSettings}
      successMsg={successMsg}
      onSave={handleSaveSettings}
    >
      {activeTab === 'BANNERS' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
              <LayoutTemplate className="text-stitch-accent" /> Promotional Sliders
            </h3>
            <button
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-2 bg-stitch-accent hover:bg-stitch-accent-hover accent-glow-hover text-stitch-accent-ink px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <ImagePlus size={18} /> Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map(banner => (
              <div key={banner.id} className="bg-stitch-card border border-stitch-border rounded-xl overflow-hidden group">
                <div className="h-48 bg-stitch-surface relative overflow-hidden">
                  <img src={`${BACKEND_URL}${banner.imageUrl}`} alt={banner.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  {!banner.isActive && (
                    <div className="absolute top-2 right-2 bg-stitch-surface/80 backdrop-blur text-stitch-muted text-xs font-bold px-2 py-1 rounded">Disabled</div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-stitch-ink text-lg truncate">{banner.title || 'Untitled Banner'}</h4>
                  <p className="text-sm text-stitch-muted mb-4 truncate">{banner.subtitle || 'No subtitle'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono bg-stitch-surface px-2 py-1 rounded text-stitch-muted">Order: {banner.displayOrder}</span>
                    <button onClick={() => handleDeleteBanner(banner.id)} className="text-stitch-danger hover:text-stitch-danger/80 bg-stitch-danger/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="col-span-full text-center p-12 border border-dashed border-stitch-border rounded-xl text-stitch-muted">
                <LayoutTemplate size={48} className="mx-auto mb-4 opacity-30" />
                No banners added. Click "Add Banner" to upload one.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="flex-1 overflow-y-auto bg-stitch-panel border border-stitch-border rounded-xl p-8 max-w-3xl">
          <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2 mb-6">
            <Globe className="text-stitch-accent" /> Global Site Settings
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Site Title</label>
                <input 
                  type="text" 
                  value={settings?.siteTitle || ''} 
                  onChange={e => setSettings({...settings, siteTitle: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Contact Phone</label>
                <input 
                  type="text" 
                  value={settings?.contactPhone || ''} 
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={settings?.whatsappNumber || ''} 
                  onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Contact Email</label>
                <input 
                  type="email" 
                  value={settings?.contactEmail || ''} 
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-stitch-muted mb-1">Physical Address</label>
                <input 
                  type="text" 
                  value={settings?.address || ''} 
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-stitch-muted mb-1">Google Map PIN (Embed URL)</label>
                <input 
                  type="text" 
                  value={settings?.googleMapUrl || ''} 
                  onChange={e => setSettings({...settings, googleMapUrl: e.target.value})}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Facebook URL</label>
                <input 
                  type="text" 
                  value={settings?.facebookUrl || ''} 
                  onChange={e => setSettings({...settings, facebookUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Instagram URL</label>
                <input 
                  type="text" 
                  value={settings?.instagramUrl || ''} 
                  onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Threads URL</label>
                <input 
                  type="text" 
                  value={settings?.threadsUrl || ''} 
                  onChange={e => setSettings({...settings, threadsUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">YouTube URL</label>
                <input 
                  type="text" 
                  value={settings?.youtubeUrl || ''} 
                  onChange={e => setSettings({...settings, youtubeUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">TikTok URL</label>
                <input 
                  type="text" 
                  value={settings?.tiktokUrl || ''} 
                  onChange={e => setSettings({...settings, tiktokUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Twitter (X) URL</label>
                <input 
                  type="text" 
                  value={settings?.twitterUrl || ''} 
                  onChange={e => setSettings({...settings, twitterUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={settings?.linkedinUrl || ''} 
                  onChange={e => setSettings({...settings, linkedinUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Pinterest URL</label>
                <input 
                  type="text" 
                  value={settings?.pinterestUrl || ''} 
                  onChange={e => setSettings({...settings, pinterestUrl: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-bold text-stitch-muted mb-1">About Text (Footer)</label>
              <textarea 
                value={settings?.aboutText || ''} 
                onChange={e => setSettings({...settings, aboutText: e.target.value})}
                rows={3}
                className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent custom-scrollbar"
                placeholder="The future of fast-casual dining..."
              />
            </div>
            <div className="mt-6">
              <label className="block text-xs font-bold text-stitch-muted mb-1">Company Info (Footer Links/Text)</label>
              <textarea 
                value={settings?.companyText || ''} 
                onChange={e => setSettings({...settings, companyText: e.target.value})}
                rows={3}
                className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent custom-scrollbar"
                placeholder="Our Culinary Journey..."
              />
            </div>
          </form>
        </div>
      )}

      {activeTab === 'MODULES' && (
        <div className="flex-1 overflow-y-auto bg-stitch-panel border border-stitch-border rounded-xl p-8 max-w-3xl">
          <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2 mb-2">
            System Feature Flags
          </h3>
          <p className="text-sm text-stitch-muted mb-8">Toggle major functionalities on or off across your entire restaurant system instantly.</p>
          
          <div className="space-y-6">
            {[
              { id: 'module_auth_enabled', label: 'Enforce Authentication (Login)', desc: 'Requires Admin, Cashiers, and Riders to log in with a password.' },
              { id: 'module_kds_enabled', label: 'Kitchen Display System (KDS)', desc: 'Enables the dedicated Kitchen Chef tracking screen.' },
              { id: 'module_loyalty_enabled', label: 'Customer Loyalty & Accounts', desc: 'Allows customers to sign up on the website and earn rewards.' },
              { id: 'module_payments_enabled', label: 'Online Card Payments', desc: 'Enables Stripe/PayPal checkout on the customer website.' }
            ].map(module => (
              <div key={module.id} className="flex items-center justify-between p-4 bg-stitch-surface border border-stitch-border rounded-xl">
                <div>
                  <h4 className="font-bold text-stitch-ink mb-1">{module.label}</h4>
                  <p className="text-xs text-stitch-muted">{module.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings[module.id] || false}
                    onChange={(e) => {
                      const newSettings = { ...settings, [module.id]: e.target.checked };
                      setSettings(newSettings);
                      // This toggle auto-saves immediately below, so the snapshot
                      // moves with it — otherwise the sticky save bar would show
                      // "unsaved changes" for a change that's already persisted.
                      settingsSnapshotRef.current = newSettings;

                      // Remove Prisma relations and read-only fields before sending
                      const { id, brand_id, updatedAt, brand, ...cleanSettings } = newSettings;

                      // Auto-save when toggled
                      fetch(`${BACKEND_URL}/cms/settings/1`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cleanSettings)
                      });
                    }}
                  />
                  <div className="w-11 h-6 bg-stitch-muted/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-stitch-ink after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stitch-ink after:border-stitch-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stitch-accent"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-stitch-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold text-stitch-ink mb-4">Upload Banner</h3>
            <form onSubmit={handleBannerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Banner Image (16:9 Recommended)</label>
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setBannerPreview(e.target?.result as string);
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
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Title (Optional)</label>
                <input 
                  type="text" 
                  value={bannerForm.title} 
                  onChange={e => setBannerForm({...bannerForm, title: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1">Subtitle (Optional)</label>
                <input 
                  type="text" 
                  value={bannerForm.subtitle} 
                  onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-3 text-stitch-ink focus:outline-none focus:border-stitch-accent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBannerModal(false)} className="flex-1 py-3 rounded-lg font-bold text-stitch-muted bg-stitch-surface hover:bg-stitch-border">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-stitch-accent-ink bg-stitch-accent hover:bg-stitch-accent-hover accent-glow-hover">Upload & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CmsShell>
  );
}
