import React, { useState, useEffect } from 'react';
import { Megaphone, Globe, Share2, Tag, Percent, CheckCircle, Store, Edit2, Trash2, PauseCircle, PlayCircle, ImagePlus, ChevronDown, ChevronRight } from 'lucide-react';

import { useAdminContext } from '../context/AdminContext';

// Inline SVG icons for social platforms not in lucide-react
const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function MarketingHub() {
  const { selectedBranchId, isBranchEntered } = useAdminContext();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [publishWeb, setPublishWeb] = useState(true);
  const [publishPos, setPublishPos] = useState(true);
  const [publishSocial, setPublishSocial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Social Links State
  const [fbLinked, setFbLinked] = useState(false);
  const [igLinked, setIgLinked] = useState(false);

  // Social OAuth Modal State
  const [showPageModal, setShowPageModal] = useState(false);
  const [fbPages, setFbPages] = useState<any[]>([]);
  const [igAccounts, setIgAccounts] = useState<any[]>([]);
  const [oauthToken, setOauthToken] = useState('');
  const [oauthPlatform, setOauthPlatform] = useState('');

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduledCampaigns, setScheduledCampaigns] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Stores and Targeting
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [targetStoreIds, setTargetStoreIds] = useState<number[]>([]);
  const [targetCategoryIds, setTargetCategoryIds] = useState<number[]>([]);
  const [targetProductIds, setTargetProductIds] = useState<number[]>([]);

  // Expanded state for tree
  const [expandedStores, setExpandedStores] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchSocialStatus();
    }
  }, [selectedBranchId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      const platform = urlParams.get('platform') || '';
      const token = urlParams.get('token') || '';
      
      setOauthToken(token);
      setOauthPlatform(platform);

      if (platform === 'facebook') {
        fetch(`${BACKEND_URL}/marketing/social/facebook/pages?token=${token}`)
          .then(res => res.json())
          .then(data => {
            setFbPages(data);
            setShowPageModal(true);
          });
      } else if (platform === 'instagram') {
        fetch(`${BACKEND_URL}/marketing/social/instagram/accounts?token=${token}`)
          .then(res => res.json())
          .then(data => {
            setIgAccounts(data);
            setShowPageModal(true);
          });
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchSocialStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/marketing/social/status?branchId=${selectedBranchId}`);
      if (res.ok) {
        const data = await res.json();
        setFbLinked(data.is_facebook_connected || false);
        setIgLinked(data.is_instagram_connected || false);
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectPage = async (page: any) => {
    if (oauthPlatform === 'facebook') {
      await fetch(`${BACKEND_URL}/marketing/social/facebook/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: selectedBranchId, pageId: page.id, pageName: page.name, token: oauthToken })
      });
      setFbLinked(true);
    } else {
      await fetch(`${BACKEND_URL}/marketing/social/instagram/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: selectedBranchId, accountId: page.id, username: page.username, token: oauthToken })
      });
      setIgLinked(true);
    }
    setShowPageModal(false);
  };

  const handleFacebookConnect = () => {
    if (!selectedBranchId) return alert('Select a branch first');
    if (fbLinked) {
      fetch(`${BACKEND_URL}/marketing/social/facebook/disconnect?branchId=${selectedBranchId}`, { method: 'DELETE' })
        .then(() => setFbLinked(false));
    } else {
      window.location.href = `${BACKEND_URL}/marketing/social/facebook/connect?branchId=${selectedBranchId}`;
    }
  };

  const handleInstagramConnect = () => {
    if (!selectedBranchId) return alert('Select a branch first');
    if (igLinked) {
      fetch(`${BACKEND_URL}/marketing/social/instagram/disconnect?branchId=${selectedBranchId}`, { method: 'DELETE' })
        .then(() => setIgLinked(false));
    } else {
      window.location.href = `${BACKEND_URL}/marketing/social/instagram/connect?branchId=${selectedBranchId}`;
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/marketing/campaign`);
      if (res.ok) setCampaigns(await res.json());

      const res2 = await fetch(`${BACKEND_URL}/marketing/schedule`);
      if (res2.ok) setScheduledCampaigns(await res2.json());

      const res3 = await fetch(`${BACKEND_URL}/stores`);
      if (res3.ok) setStores(await res3.json());

      const res4 = await fetch(`${BACKEND_URL}/catalog/categories`);
      if (res4.ok) setCategories(await res4.json());

      const res5 = await fetch(`${BACKEND_URL}/catalog/products`);
      if (res5.ok) setProducts(await res5.json());
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discountPct) return;
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('discount_pct', discountPct);
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        // ── UPDATE existing campaign or scheduled deal ──
        const endpoint = isScheduled ? `/marketing/schedule/${editingId}` : `/marketing/campaign/${editingId}`;
        
        if (isScheduled) {
          if (!startDate || !endDate) {
            setSuccessMsg('Start and End dates are required.');
            setIsSubmitting(false);
            return;
          }
          formData.append('start_date', new Date(startDate).toISOString());
          formData.append('end_date', new Date(endDate).toISOString());
        } else {
          if (description) formData.append('description', description);
          formData.append('published_web', String(publishWeb));
          formData.append('published_pos', String(publishPos));
          formData.append('published_social', String(publishSocial));
          targetStoreIds.forEach(id => formData.append('target_store_ids[]', String(id)));
          targetCategoryIds.forEach(id => formData.append('target_category_ids[]', String(id)));
          targetProductIds.forEach(id => formData.append('target_product_ids[]', String(id)));
        }

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'PATCH',
          body: formData
        });
        
        if (res.ok) {
          setSuccessMsg('Deal updated successfully!');
        } else {
          setSuccessMsg('Failed to update deal.');
        }
        await fetchCampaigns();
        setEditingId(null);
        setTitle('');
        setDescription('');
        setDiscountPct('');
        setStartDate('');
        setEndDate('');
        setIsScheduled(false);
        setPublishWeb(true);
        setPublishPos(true);
        setPublishSocial(false);
        setImageFile(null);
        setTargetStoreIds([]);
        setTargetCategoryIds([]);
        setTargetProductIds([]);
      } else if (isScheduled) {
        if (!startDate || !endDate) {
          setSuccessMsg('Start and End dates are required.');
          setIsSubmitting(false);
          return;
        }
        formData.append('start_date', new Date(startDate).toISOString());
        formData.append('end_date', new Date(endDate).toISOString());
        formData.append('published_web', String(publishWeb));
        formData.append('published_pos', String(publishPos));
        formData.append('published_social', String(publishSocial));
        targetStoreIds.forEach(id => formData.append('target_store_ids[]', String(id)));
        targetCategoryIds.forEach(id => formData.append('target_category_ids[]', String(id)));
        targetProductIds.forEach(id => formData.append('target_product_ids[]', String(id)));

        const res = await fetch(`${BACKEND_URL}/marketing/schedule`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          setSuccessMsg('Deal scheduled successfully! It will automatically launch on the start date.');
          await fetchCampaigns();
          setTitle(''); setDescription(''); setDiscountPct('');
          setStartDate(''); setEndDate(''); setImageFile(null);
          setTargetStoreIds([]);
          setTargetCategoryIds([]);
          setTargetProductIds([]);
        }
      } else {
        // ── CREATE new campaign ──
        if (description) formData.append('description', description);
        formData.append('published_web', String(publishWeb));
        formData.append('published_pos', String(publishPos));
        formData.append('published_social', String(publishSocial));
        targetStoreIds.forEach(id => formData.append('target_store_ids[]', String(id)));
        targetCategoryIds.forEach(id => formData.append('target_category_ids[]', String(id)));
        targetProductIds.forEach(id => formData.append('target_product_ids[]', String(id)));

        const res = await fetch(`${BACKEND_URL}/marketing/campaign`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          setSuccessMsg('Campaign launched successfully!');
          await fetchCampaigns();
          setTitle(''); setDescription(''); setDiscountPct('');
          setPublishWeb(true); setPublishPos(true); setPublishSocial(false);
          setImageFile(null);
          setTargetStoreIds([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (camp: any) => {
    setEditingId(camp.id);
    setTitle(camp.title);
    setDescription(camp.description || '');
    setDiscountPct(String(camp.discount_pct));
    setPublishWeb(camp.published_web);
    setPublishPos(camp.published_pos);
    setPublishSocial(camp.published_social);
    setTargetStoreIds(camp.target_stores?.map((s:any) => s.id) || []);
    setTargetCategoryIds(camp.target_categories?.map((c:any) => c.id) || []);
    setTargetProductIds(camp.target_products?.map((p:any) => p.id) || []);
    setIsScheduled(false);
    setSuccessMsg('');
    setImageFile(null);
    const formEl = document.getElementById('campaign-form-top');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSchedule = (camp: any) => {
    setEditingId(camp.id);
    setTitle(camp.title);
    setDescription('');
    setDiscountPct(String(camp.discount_pct));
    if (camp.start_date) {
      const d = new Date(camp.start_date);
      const localStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setStartDate(localStr);
    }
    if (camp.end_date) {
      const d = new Date(camp.end_date);
      const localStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setEndDate(localStr);
    }
    setTargetStoreIds(camp.target_stores?.map((s:any) => s.id) || []);
    setTargetCategoryIds(camp.target_categories?.map((c:any) => c.id) || []);
    setTargetProductIds(camp.target_products?.map((p:any) => p.id) || []);
    setIsScheduled(true);
    setSuccessMsg('');
    setImageFile(null);
    const formEl = document.getElementById('campaign-form-top');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDiscountPct('');
    setPublishWeb(true);
    setPublishPos(true);
    setPublishSocial(false);
    setStartDate('');
    setEndDate('');
    setIsScheduled(false);
    setTargetStoreIds([]);
    setTargetCategoryIds([]);
    setTargetProductIds([]);
    setSuccessMsg('');
    setImageFile(null);
  };

  const [deleteConfirmType, setDeleteConfirmType] = useState<'CAMPAIGN' | 'SCHEDULED' | null>(null);

  const handleDelete = async (id: number, type: 'CAMPAIGN' | 'SCHEDULED' = 'CAMPAIGN') => {
    setDeleteConfirmId(id);
    setDeleteConfirmType(type);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const isScheduled = deleteConfirmType === 'SCHEDULED';
      const endpoint = isScheduled ? `/marketing/schedule/${deleteConfirmId}` : `/marketing/campaign/${deleteConfirmId}`;
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { method: 'DELETE' });
      
      if (isScheduled) {
        setScheduledCampaigns(prev => prev.filter(c => c.id !== deleteConfirmId));
      } else {
        setCampaigns(prev => prev.filter(c => c.id !== deleteConfirmId));
      }
      if (!res.ok) console.warn('Backend delete failed, removed from UI only');
    } catch (e) { 
      const isScheduled = deleteConfirmType === 'SCHEDULED';
      if (isScheduled) setScheduledCampaigns(prev => prev.filter(c => c.id !== deleteConfirmId));
      else setCampaigns(prev => prev.filter(c => c.id !== deleteConfirmId));
      console.error(e); 
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    }
  };

  const handleTogglePause = async (camp: any, isScheduledType = false) => {
    const isCurrentlyPaused = isScheduledType ? !camp.is_active : camp.is_paused;
    const newPausedState = !isCurrentlyPaused;

    if (isScheduledType) {
      setScheduledCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_active: !newPausedState } : c));
    } else {
      setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_paused: newPausedState } : c));
    }

    try {
      const endpoint = isScheduledType ? `/marketing/schedule/${camp.id}` : `/marketing/campaign/${camp.id}`;
      const payload = isScheduledType ? { is_active: !newPausedState } : { is_paused: newPausedState };
      await fetch(`${BACKEND_URL}${endpoint}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { 
      if (isScheduledType) {
        setScheduledCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_active: camp.is_active } : c));
      } else {
        setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_paused: camp.is_paused } : c));
      }
      console.error(e); 
    }
  };


  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div id="campaign-form-top" className="mb-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Megaphone className="text-[#ec4899]" size={32} /> Marketing & Campaigns
        </h2>
        <p className="text-slate-400 text-sm mt-1">Create deals and push them to POS, Website, and Social Media instantly.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Deal Creator / Editor Form */}
        <div className={`flex-1 border rounded-3xl p-8 shadow-xl transition-all ${editingId ? 'bg-slate-800 border-amber-500/50 ring-2 ring-amber-500/20' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Tag size={20} className={editingId ? 'text-amber-400' : 'text-[#3b82f6]'} />
              {editingId ? '✏️ Edit Deal' : 'Create New Deal'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all"
              >
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Weekend BOGO"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ec4899] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details for the customer..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ec4899] transition-colors h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Banner Image (Optional)</label>
              <div className="relative">
                <ImagePlus size={16} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#ec4899] transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ec4899] file:text-white hover:file:bg-pink-600 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Recommended size: 1080x1440 (Vertical). Will be displayed on TV Board and POS.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Percentage (%)</label>
              <div className="relative">
                <Percent size={16} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  placeholder="20"
                  max="100"
                  min="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#ec4899] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Branches, Categories & Items</label>
              <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white max-h-64 overflow-y-auto flex flex-col gap-1">
                {(() => {
                  const displayStores = isBranchEntered && selectedBranchId ? stores.filter(s => s.id === selectedBranchId) : stores;
                  return displayStores.length === 0 ? (
                    <span className="text-sm text-slate-500">No branches found.</span>
                  ) : displayStores.map(s => {
                  const isStoreExpanded = expandedStores.includes(s.id);
                  return (
                  <div key={`store-${s.id}`} className="flex flex-col">
                    <div className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded">
                      <button type="button" onClick={() => setExpandedStores(prev => isStoreExpanded ? prev.filter(id => id !== s.id) : [...prev, s.id])} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        {isStoreExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input 
                          type="checkbox" 
                          checked={targetStoreIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) setTargetStoreIds([...targetStoreIds, s.id]);
                            else setTargetStoreIds(targetStoreIds.filter(id => id !== s.id));
                          }}
                          className="accent-[#ec4899]"
                        />
                        <span className="text-sm font-bold">{s.name}</span>
                      </label>
                    </div>
                    {isStoreExpanded && (
                      <div className="ml-6 pl-2 border-l border-slate-700/50 flex flex-col gap-1 mt-1">
                        {categories.map(c => {
                          const isCatExpanded = expandedCategories.includes(c.id);
                          return (
                          <div key={`cat-${c.id}`} className="flex flex-col">
                            <div className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded">
                              <button type="button" onClick={() => setExpandedCategories(prev => isCatExpanded ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                                {isCatExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input 
                                  type="checkbox" 
                                  checked={targetCategoryIds.includes(c.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setTargetCategoryIds([...targetCategoryIds, c.id]);
                                    else setTargetCategoryIds(targetCategoryIds.filter(id => id !== c.id));
                                  }}
                                  className="accent-amber-500"
                                />
                                <span className="text-sm text-slate-300">{c.name}</span>
                              </label>
                            </div>
                            {isCatExpanded && (
                              <div className="ml-6 pl-2 border-l border-slate-700/50 flex flex-col gap-1 mt-1">
                                {products.filter(p => p.categories?.some((cat: any) => cat.id === c.id)).map(p => (
                                  <label key={`prod-${p.id}`} className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={targetProductIds.includes(p.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setTargetProductIds([...targetProductIds, p.id]);
                                        else setTargetProductIds(targetProductIds.filter(id => id !== p.id));
                                      }}
                                      className="accent-blue-500 ml-4"
                                    />
                                    <span className="text-sm text-slate-400">{p.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                  )})}
                )()}
              </div>
              <p className="text-xs text-slate-500 mt-1">If no branch/category/item is selected, the deal applies globally.</p>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="w-5 h-5 accent-[#8b5cf6]" />
                <span className="text-sm font-bold text-white">Schedule for later (Automated)</span>
              </label>

              {isScheduled && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Start Date</label>
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8b5cf6]" required={isScheduled} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">End Date</label>
                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8b5cf6]" required={isScheduled} />
                  </div>
                </div>
              )}

              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Publish To</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 cursor-pointer hover:border-[#4edea3] transition-colors">
                  <input type="checkbox" checked={publishWeb} onChange={(e) => setPublishWeb(e.target.checked)} className="w-5 h-5 accent-[#4edea3]" />
                  <div className="flex items-center gap-2"><Globe size={18} className="text-[#4edea3]" /> <span className="text-sm font-bold text-white">Website</span></div>
                </label>
                
                <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 cursor-pointer hover:border-[#fbbf24] transition-colors">
                  <input type="checkbox" checked={publishPos} onChange={(e) => setPublishPos(e.target.checked)} className="w-5 h-5 accent-[#fbbf24]" />
                  <div className="flex items-center gap-2"><Store size={18} className="text-[#fbbf24]" /> <span className="text-sm font-bold text-white">POS System</span></div>
                </label>
                {(fbLinked || igLinked) && (
                  <label className="col-span-2 flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 cursor-pointer hover:border-[#3b82f6] transition-colors">
                    <input type="checkbox" checked={publishSocial} onChange={(e) => setPublishSocial(e.target.checked)} className="w-5 h-5 accent-[#3b82f6]" />
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Share2 size={18} className="text-[#3b82f6]" /> Social Media 
                      {fbLinked && <span className="ml-2 text-blue-500 text-xs">FB</span>}
                      {igLinked && <span className="text-pink-500 text-xs">IG</span>}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {successMsg && (
              <div className="bg-[#4edea3]/20 border border-[#4edea3]/50 text-[#4edea3] p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle size={18} /> {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-black py-4 rounded-xl shadow-lg transition-all text-white ${
                editingId 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90' 
                  : 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] hover:opacity-90'
              }`}
            >
              {isSubmitting 
                ? (editingId ? 'Updating...' : 'Publishing...') 
                : isScheduled 
                  ? 'Schedule Deal ⏳' 
                  : editingId 
                    ? '💾 Update Deal' 
                    : 'Launch Campaign 🚀'
              }
            </button>
          </form>
        </div>

        {/* Active Campaigns List & Social Media */}
        <div className="w-full xl:w-[450px] shrink-0 space-y-8">
          <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Share2 size={20} className="text-[#3b82f6]" /> Social Media Integration
            </h3>
            <p className="text-sm text-slate-400 mb-6">Link your branch's social media accounts to auto-post campaigns and deals.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleFacebookConnect}
                className={`flex items-center justify-between p-4 rounded-xl border font-bold transition-all ${fbLinked ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <div className="flex items-center gap-2"><FacebookIcon size={20} /> Facebook Page</div>
                {fbLinked ? <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Linked</span> : <span className="text-xs">Connect</span>}
              </button>
              <button 
                onClick={handleInstagramConnect}
                className={`flex items-center justify-between p-4 rounded-xl border font-bold transition-all ${igLinked ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <div className="flex items-center gap-2"><InstagramIcon size={20} /> Instagram Account</div>
                {igLinked ? <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded">Linked</span> : <span className="text-xs">Connect</span>}
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Share2 size={20} className="text-[#4edea3]" /> Active Campaigns
          </h3>
          
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center text-slate-500">
                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active campaigns found.</p>
              </div>
            ) : (
              campaigns.map((camp) => (
                <div key={camp.id} className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
                  editingId === camp.id 
                    ? 'bg-slate-800 border-amber-500/70 ring-2 ring-amber-500/30' 
                    : camp.is_paused 
                      ? 'bg-slate-800/50 border-slate-700 opacity-60' 
                      : 'bg-slate-800 border-slate-700'
                }`}>
                  {/* Top-right badge */}
                  <div className={`absolute top-0 right-0 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg ${camp.is_paused ? 'bg-slate-500' : 'bg-[#ec4899]'}`}>
                    {camp.is_paused ? 'PAUSED' : `${camp.discount_pct}% OFF`}
                  </div>
                  {editingId === camp.id && (
                    <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-br-lg">
                      EDITING
                    </div>
                  )}
                  <h4 className={`text-lg font-black mt-1 ${camp.is_paused ? 'text-slate-400' : 'text-white'}`}>{camp.title}</h4>
                  {camp.description && <p className="text-sm text-slate-400 mt-1">{camp.description}</p>}
                  
                  {camp.image_url && (
                    <div className="mt-3 w-full h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                      <img src={`${BACKEND_URL}${camp.image_url}`} alt={camp.title} className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500">LIVE ON:</span>
                      {camp.published_web && <Globe size={14} className="text-[#4edea3]" title="Website" />}
                      {camp.published_pos && <Store size={14} className="text-[#fbbf24]" title="POS System" />}
                      {camp.published_social && (
                        <div className="flex gap-2">
                          <div className="group relative">
                            <FacebookIcon size={14} />
                            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${camp.published_facebook ? 'bg-green-500' : 'bg-red-500'}`} title={camp.published_facebook ? "Published to Facebook" : "Publishing failed"}></div>
                          </div>
                          <div className="group relative">
                            <InstagramIcon size={14} />
                            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${camp.published_instagram ? 'bg-green-500' : 'bg-red-500'}`} title={camp.published_instagram ? "Published to Instagram" : "Publishing failed"}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* Pause / Resume button with color feedback */}
                      <button 
                        onClick={() => handleTogglePause(camp)} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          camp.is_paused 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                        }`}
                        title={camp.is_paused ? 'Resume Campaign' : 'Pause Campaign'}
                      >
                        {camp.is_paused 
                          ? <><PlayCircle size={14} /> Resume</>
                          : <><PauseCircle size={14} /> Pause</>
                        }
                      </button>
                      <button 
                        onClick={() => handleEdit(camp)} 
                        className={`p-2 rounded-lg transition-colors ${
                          editingId === camp.id 
                            ? 'bg-amber-500/30 text-amber-400 border border-amber-500/30' 
                            : 'bg-slate-700 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400'
                        }`} 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(camp.id)} 
                        className="p-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {scheduledCampaigns.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Percent size={20} className="text-[#8b5cf6]" /> Upcoming Scheduled Deals
              </h3>
              <div className="space-y-4">
                {scheduledCampaigns.map((camp) => (
                  <div key={camp.id} className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
                    editingId === camp.id && isScheduled
                      ? 'bg-slate-800 border-amber-500/70 ring-2 ring-amber-500/30' 
                      : !camp.is_active 
                        ? 'bg-slate-800/50 border-slate-700 opacity-60' 
                        : 'bg-slate-800 border-slate-700 opacity-80'
                  }`}>
                    {/* Top-right badge */}
                    <div className={`absolute top-0 right-0 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg ${!camp.is_active ? 'bg-slate-500' : 'bg-[#8b5cf6]'}`}>
                      {!camp.is_active ? 'PAUSED' : `${camp.discount_pct}% OFF`}
                    </div>
                    {editingId === camp.id && isScheduled && (
                      <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-br-lg">
                        EDITING
                      </div>
                    )}
                    <h4 className={`text-lg font-black mt-1 ${!camp.is_active ? 'text-slate-400' : 'text-white'}`}>{camp.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Scheduled to start at: <strong className="text-white">{new Date(camp.start_date).toLocaleString()}</strong>
                    </p>

                    {camp.image_url && (
                      <div className="mt-3 w-full h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                        <img src={`${BACKEND_URL}${camp.image_url}`} alt={camp.title} className="w-full h-full object-cover opacity-80" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">WILL PUBLISH TO:</span>
                        <Globe size={14} className="text-[#4edea3]" />
                        <Store size={14} className="text-[#fbbf24]" />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTogglePause(camp, true)} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            !camp.is_active 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                          }`}
                          title={!camp.is_active ? 'Resume Schedule' : 'Pause Schedule'}
                        >
                          {!camp.is_active 
                            ? <><PlayCircle size={14} /> Resume</>
                            : <><PauseCircle size={14} /> Pause</>
                          }
                        </button>
                        <button 
                          onClick={() => handleEditSchedule(camp)} 
                          className={`p-2 rounded-lg transition-colors ${
                            editingId === camp.id && isScheduled
                              ? 'bg-amber-500/30 text-amber-400 border border-amber-500/30' 
                              : 'bg-slate-700 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400'
                          }`} 
                          title="Edit Schedule"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(camp.id, 'SCHEDULED')} 
                          className="p-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors" 
                          title="Delete Schedule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Delete Campaign?</h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone. The campaign will be removed from all platforms.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
        {showPageModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden border border-slate-700 shadow-2xl">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-black text-white">Select {oauthPlatform === 'facebook' ? 'Facebook Page' : 'Instagram Account'}</h2>
                <p className="text-sm text-slate-400 mt-1">Choose the account to link with this branch.</p>
              </div>
              <div className="p-6 space-y-3">
                {oauthPlatform === 'facebook' && fbPages.map(page => (
                  <button key={page.id} onClick={() => handleSelectPage(page)} className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-blue-500/10 hover:border-blue-500 transition-colors">
                    <div className="font-bold text-white">{page.name}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {page.id}</div>
                  </button>
                ))}
                {oauthPlatform === 'instagram' && igAccounts.map(account => (
                  <button key={account.id} onClick={() => handleSelectPage(account)} className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-pink-500/10 hover:border-pink-500 transition-colors">
                    <div className="font-bold text-white">{account.username}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {account.id}</div>
                  </button>
                ))}
                {((oauthPlatform === 'facebook' && fbPages.length === 0) || (oauthPlatform === 'instagram' && igAccounts.length === 0)) && (
                  <p className="text-slate-400 text-sm text-center py-4">No accounts found.</p>
                )}
              </div>
              <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end">
                <button onClick={() => setShowPageModal(false)} className="px-6 py-2.5 rounded-full font-bold text-slate-300 hover:text-white transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
