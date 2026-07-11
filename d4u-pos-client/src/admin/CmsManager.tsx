import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, ImagePlus, Trash2, Save, Globe } from 'lucide-react';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function CmsManager() {
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'SETTINGS'>('BANNERS');
  
  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', linkUrl: '', buttonText: '', isActive: true, displayOrder: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [settings, setSettings] = useState<any>({ siteTitle: '', contactPhone: '', contactEmail: '', address: '', facebookUrl: '', instagramUrl: '', whatsappNumber: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cms/banners`);
      if (res.ok) setBanners(await res.json());
    } catch (e) {
      console.error('Failed to fetch banners', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cms/settings`);
      if (res.ok) setSettings(await res.json());
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchSettings();
  }, []);

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert('Please select an image file first.');

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
    if (!window.confirm('Delete this banner?')) return;
    try {
      await fetch(`${BACKEND_URL}/cms/banners/${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (e) {
      console.error('Failed to delete banner', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${BACKEND_URL}/cms/settings/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings Saved Successfully!');
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    setIsSavingSettings(false);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('BANNERS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'BANNERS' ? 'bg-[#ec4899] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Website Banners
        </button>
        <button 
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'SETTINGS' ? 'bg-[#ec4899] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Site Settings
        </button>
      </div>

      {activeTab === 'BANNERS' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutTemplate className="text-[#ec4899]" /> Promotional Sliders
            </h3>
            <button 
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-2 bg-[#ec4899] hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <ImagePlus size={18} /> Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map(banner => (
              <div key={banner.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group">
                <div className="h-48 bg-slate-900 relative overflow-hidden">
                  <img src={`${BACKEND_URL}${banner.imageUrl}`} alt={banner.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  {!banner.isActive && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-slate-400 text-xs font-bold px-2 py-1 rounded">Disabled</div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-white text-lg truncate">{banner.title || 'Untitled Banner'}</h4>
                  <p className="text-sm text-slate-400 mb-4 truncate">{banner.subtitle || 'No subtitle'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">Order: {banner.displayOrder}</span>
                    <button onClick={() => handleDeleteBanner(banner.id)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="col-span-full text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
                <LayoutTemplate size={48} className="mx-auto mb-4 opacity-30" />
                No banners added. Click "Add Banner" to upload one.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="flex-1 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-3xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Globe className="text-[#ec4899]" /> Global Site Settings
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Site Title</label>
                <input 
                  type="text" 
                  value={settings?.siteTitle || ''} 
                  onChange={e => setSettings({...settings, siteTitle: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Contact Phone</label>
                <input 
                  type="text" 
                  value={settings?.contactPhone || ''} 
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={settings?.whatsappNumber || ''} 
                  onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  value={settings?.contactEmail || ''} 
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">Physical Address</label>
                <input 
                  type="text" 
                  value={settings?.address || ''} 
                  onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Facebook URL</label>
                <input 
                  type="text" 
                  value={settings?.facebookUrl || ''} 
                  onChange={e => setSettings({...settings, facebookUrl: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Instagram URL</label>
                <input 
                  type="text" 
                  value={settings?.instagramUrl || ''} 
                  onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700 flex justify-end">
              <button 
                type="submit" 
                disabled={isSavingSettings}
                className="flex items-center gap-2 bg-[#ec4899] hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                <Save size={18} /> {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">Upload Banner</h3>
            <form onSubmit={handleBannerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Banner Image (16:9 Recommended)</label>
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ec4899]/10 file:text-[#ec4899] hover:file:bg-[#ec4899]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Title (Optional)</label>
                <input 
                  type="text" 
                  value={bannerForm.title} 
                  onChange={e => setBannerForm({...bannerForm, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle (Optional)</label>
                <input 
                  type="text" 
                  value={bannerForm.subtitle} 
                  onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#ec4899]"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBannerModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#ec4899] hover:bg-pink-600">Upload & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
