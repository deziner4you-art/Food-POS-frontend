import React, { useState, useEffect, useRef } from 'react';
import { customAlert, customConfirm } from '../utils/alerts';
import { useAdminContext } from '../context/AdminContext';
import CmsShell from '../components/cms/CmsShell';
import type { CmsTab } from '../components/cms/CmsSectionNav';
import BannerGrid from '../components/cms/banner/BannerGrid';
import BannerUploadModal from '../components/cms/banner/BannerUploadModal';
import SettingsForm from '../components/cms/settings/SettingsForm';

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
  const [bannersLoading, setBannersLoading] = useState(true);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', linkUrl: '', buttonText: '', isActive: true, displayOrder: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings & Modules State
  // tiktokUrl/linkedinUrl/pinterestUrl/threadsUrl removed entirely — they
  // were never part of UpdateSettingsDto/CmsSettings, so they never
  // persisted; keeping them in state would just keep sending dead data.
  const [settings, setSettings] = useState<any>({
    siteTitle: '', contactPhone: '', contactEmail: '', address: '', googleMapUrl: '',
    facebookUrl: '', instagramUrl: '', whatsappNumber: '',
    twitterUrl: '', youtubeUrl: '', aboutText: '', companyText: '',
    module_auth_enabled: false, module_kds_enabled: true, module_loyalty_enabled: false, module_payments_enabled: false
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/cms/banners`);
      if (res.ok) setBanners(await res.json());
    } catch (e) {
      console.error('Failed to fetch banners', e);
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!selectedBranchId) return;
    setSettingsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        settingsSnapshotRef.current = data;
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsFieldChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
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

  const resetBannerForm = () => {
    setBannerForm({ title: '', subtitle: '', linkUrl: '', buttonText: '', isActive: true, displayOrder: 0 });
    setSelectedFile(null);
    setBannerPreview(null);
  };

  const closeBannerModal = () => {
    setShowBannerModal(false);
    setEditingBanner(null);
    resetBannerForm();
  };

  const openCreateBannerModal = () => {
    setEditingBanner(null);
    resetBannerForm();
    setShowBannerModal(true);
  };

  const openEditBannerModal = (banner: any) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      isActive: banner.isActive,
      displayOrder: banner.displayOrder || 0,
    });
    setSelectedFile(null);
    setBannerPreview(null);
    setShowBannerModal(true);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Edit mode — the update endpoint takes plain JSON (no FileInterceptor
    // on the backend route), so this only ever patches text/status fields,
    // never the image itself.
    if (editingBanner) {
      try {
        const res = await fetch(`${BACKEND_URL}/cms/banners/${editingBanner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: bannerForm.title,
            subtitle: bannerForm.subtitle,
            isActive: bannerForm.isActive,
          }),
        });
        if (res.ok) {
          closeBannerModal();
          fetchBanners();
        }
      } catch (e) {
        console.error('Failed to update banner', e);
      }
      return;
    }

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
        closeBannerModal();
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

  // Reorder via drag-and-drop in BannerGrid: apply the new order optimistically,
  // then persist only the banners whose displayOrder actually changed through
  // the existing update endpoint (no new endpoint, no DTO change).
  const handleReorderBanners = async (reordered: any[]) => {
    const previous = banners;
    setBanners(reordered);

    const changed = reordered
      .map((b, index) => ({ id: b.id, displayOrder: index, prevOrder: b.displayOrder }))
      .filter((b) => b.displayOrder !== b.prevOrder);

    if (changed.length === 0) return;

    try {
      await Promise.all(
        changed.map((b) =>
          fetch(`${BACKEND_URL}/cms/banners/${b.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayOrder: b.displayOrder }),
          })
        )
      );
      fetchBanners();
    } catch (e) {
      console.error('Failed to reorder banners', e);
      setBanners(previous);
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
        <BannerGrid
          banners={banners}
          loading={bannersLoading}
          backendUrl={BACKEND_URL}
          onAddClick={openCreateBannerModal}
          onEdit={openEditBannerModal}
          onDelete={handleDeleteBanner}
          onReorder={handleReorderBanners}
        />
      )}

      {activeTab === 'SETTINGS' && (
        <SettingsForm
          settings={settings}
          errors={{}}
          loading={settingsLoading}
          onFieldChange={handleSettingsFieldChange}
          onSubmit={handleSaveSettings}
        />
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

      {/* Upload / Edit Modal */}
      {showBannerModal && (
        <BannerUploadModal
          mode={editingBanner ? 'edit' : 'create'}
          bannerForm={bannerForm}
          setBannerForm={setBannerForm}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          bannerPreview={bannerPreview}
          setBannerPreview={setBannerPreview}
          existingImageSrc={editingBanner ? `${BACKEND_URL}${editingBanner.imageUrl}` : undefined}
          fileInputRef={fileInputRef}
          onClose={closeBannerModal}
          onSubmit={handleBannerSubmit}
        />
      )}
    </CmsShell>
  );
}
