import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Images } from 'lucide-react';
import { customAlert, customConfirm } from '../utils/alerts';
import { apiFetch, BACKEND_URL } from '../utils/api';
import { useAdminContext } from '../context/AdminContext';
import CmsShell from '../components/cms/CmsShell';
import type { CmsTab } from '../components/cms/CmsSectionNav';
import BannerGrid from '../components/cms/banner/BannerGrid';
import BannerUploadModal from '../components/cms/banner/BannerUploadModal';
import SettingsForm from '../components/cms/settings/SettingsForm';
import ModuleToggleList from '../components/cms/modules/ModuleToggleList';
import ComingSoonSection from '../components/cms/ComingSoonSection';

// Static feature-flag definitions — same labels/descriptions/keys the
// Modules tab has always used, just named so they can be passed as a
// prop instead of living inline inside the JSX.
const MODULE_DEFINITIONS = [
  { id: 'module_auth_enabled', label: 'Enforce Authentication (Login)', description: 'Requires Admin, Cashiers, and Riders to log in with a password.' },
  { id: 'module_kds_enabled', label: 'Kitchen Display System (KDS)', description: 'Enables the dedicated Kitchen Chef tracking screen.' },
  { id: 'module_loyalty_enabled', label: 'Customer Loyalty & Accounts', description: 'Allows customers to sign up on the website and earn rewards.' },
  { id: 'module_payments_enabled', label: 'Online Card Payments', description: 'Enables Stripe/PayPal checkout on the customer website.' },
];

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
    module_auth_enabled: false, module_kds_enabled: true, module_loyalty_enabled: false, module_payments_enabled: false,
    hasInventoryUnlockPin: false
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/cms/banners`);
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
      const res = await apiFetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`);
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

  // Extracted verbatim from the previous inline onChange — same auto-save-
  // on-toggle behavior, same hardcoded store_id=1 (pre-existing, unrelated
  // quirk, not touched), same snapshot sync so the sticky save bar doesn't
  // show "unsaved changes" for a toggle that already persisted.
  const handleToggleModule = (moduleId: string, checked: boolean) => {
    const newSettings = { ...settings, [moduleId]: checked };
    setSettings(newSettings);
    settingsSnapshotRef.current = newSettings;

    // Remove Prisma relations and read-only fields before sending
    const { id, brand_id, store_id, updatedAt, brand, store, ...cleanSettings } = newSettings;

    // Auto-save when toggled to the currently selected branch
    if (selectedBranchId) {
      apiFetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanSettings)
      });
    }
  };

  // Sends only the new PIN, scoped to whichever branch is currently
  // selected — not the general settings object, so this can never
  // accidentally overwrite unrelated fields (or, unlike handleToggleModule
  // above, silently write to the wrong branch).

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
        const res = await apiFetch(`${BACKEND_URL}/cms/banners/${editingBanner.id}`, {
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
      const res = await apiFetch(`${BACKEND_URL}/cms/banners`, {
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
      await apiFetch(`${BACKEND_URL}/cms/banners/${id}`, { method: 'DELETE' });
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
          apiFetch(`${BACKEND_URL}/cms/banners/${b.id}`, {
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

      const res = await apiFetch(`${BACKEND_URL}/cms/settings/${selectedBranchId}`, {
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
        <div className="flex-1 overflow-y-auto space-y-6">
          <ModuleToggleList modules={MODULE_DEFINITIONS} settings={settings} onToggle={handleToggleModule} />
        </div>
      )}

      {activeTab === 'SEO' && (
        <ComingSoonSection
          title="SEO"
          description="Meta titles, descriptions, and social previews aren't connected to a backend yet."
          icon={Search}
        />
      )}

      {activeTab === 'PAGES' && (
        <ComingSoonSection
          title="Pages"
          description="A general page editor isn't connected to a backend yet."
          icon={FileText}
        />
      )}

      {activeTab === 'MEDIA' && (
        <ComingSoonSection
          title="Media Library"
          description="A reusable asset library isn't connected to a backend yet."
          icon={Images}
        />
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
