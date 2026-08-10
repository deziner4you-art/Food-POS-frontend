import React, { useState, useEffect } from 'react';
import { Megaphone, Globe, Share2, Tag, Percent, CheckCircle, Store, Edit2, Trash2, PauseCircle, PlayCircle, ImagePlus, ChevronDown, ChevronRight, Users, MousePointer2, Activity, Target, TrendingUp, History, Copy, X } from 'lucide-react';

import { useAdminContext } from '../context/AdminContext';
import { apiFetch } from '../utils/api';

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

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

// The Active/Scheduled campaign badge used to unconditionally read
// `${camp.discount_pct}% OFF` regardless of campaign_type — a BOGO campaign
// (whose reward is FREE, not a %) showed a stray leftover discount_pct value
// from whatever the form last held. Branch on the real type instead.
function getCampaignBadgeLabel(camp: any): string {
  switch (camp.campaign_type) {
    case 'FLAT':
      return `Rs. ${camp.flat_discount_amount} OFF`;
    case 'BOGO':
    case 'BUY_X_GET_Y':
      return `BUY ${camp.buy_qty} GET ${camp.reward_qty} ${camp.reward_type === 'PERCENTAGE' ? `${camp.discount_pct}% OFF` : 'FREE'}`;
    case 'BUNDLE':
    case 'COMBO':
      return `FIXED PRICE Rs. ${camp.bundle_price}`;
    case 'FREE_GIFT':
      return 'FREE GIFT';
    case 'PERCENTAGE':
    default:
      return `${camp.discount_pct}% OFF`;
  }
}

export default function MarketingHub() {
 const { selectedBranchId, isBranchEntered, branches, activeBrandId } = useAdminContext();
 const [campaigns, setCampaigns] = useState<any[]>([]);
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [discountPct, setDiscountPct] = useState('');
 const [publishWeb, setPublishWeb] = useState(true);
 const [publishPos, setPublishPos] = useState(true);
 const [publishFacebook, setPublishFacebook] = useState(false);
 const [publishInstagram, setPublishInstagram] = useState(false);
 const [publishTv, setPublishTv] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');

 // UI reorganization: split the previously all-in-one-page layout into tabs
 // so the Create form, live campaigns list, social linking, and analytics
 // don't all compete for attention on one long page.
 const [activeTab, setActiveTab] = useState<'create' | 'campaigns' | 'social' | 'analytics'>('create');
 
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

 // Targeting (stores come from AdminContext.branches)
 const [categories, setCategories] = useState<any[]>([]);
 const [products, setProducts] = useState<any[]>([]);
 
 // Defaults to the branch currently being viewed -- previously always
 // started empty, so an admin who didn't think to manually tick the one
 // checkbox shown (very easy to miss: "I'm looking at this branch, of
 // course it's for this branch") got an accidental brand-wide campaign
 // instead. Leaving it empty is still possible and remains the explicit
 // "apply to every branch of this brand" choice -- it just has to be a
 // deliberate uncheck now, not a silent default.
 const defaultTargetStoreIds = () => (isBranchEntered && selectedBranchId ? [Number(selectedBranchId)] : []);
 const [targetStoreIds, setTargetStoreIds] = useState<number[]>(defaultTargetStoreIds);
 const [targetCategoryIds, setTargetCategoryIds] = useState<number[]>([]);
 const [targetProductIds, setTargetProductIds] = useState<number[]>([]);

 // Expanded state for tree
 const [expandedStores, setExpandedStores] = useState<number[]>([]);
 const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
 
 const [kpis, setKpis] = useState<any>({ ctr: 0, conversionRate: 0, totalRevenue: 0, totalOrders: 0, aov: 0, roi: 0 });
 const [kpiPreset, setKpiPreset] = useState('today');
 const [kpiFrom, setKpiFrom] = useState('');
 const [kpiTo, setKpiTo] = useState('');

 // MARKETING-001: campaign type + BOGO
 const [campaignType, setCampaignType] = useState<'PERCENTAGE' | 'FLAT' | 'BOGO' | 'BUY_X_GET_Y' | 'BUNDLE' | 'COMBO' | 'FREE_GIFT'>('PERCENTAGE');
 const [flatDiscountAmount, setFlatDiscountAmount] = useState('');
 const [buyProductId, setBuyProductId] = useState('');
 const [buyQty, setBuyQty] = useState('1');
 const [getProductId, setGetProductId] = useState('');
 const [rewardType, setRewardType] = useState<'FREE' | 'PERCENTAGE'>('FREE');
 const [rewardQty, setRewardQty] = useState('1');
 const [priority, setPriority] = useState('0');
 const [allowStacking, setAllowStacking] = useState(false);
 const [bundleProductIds, setBundleProductIds] = useState<number[]>([]);
 const [bundlePrice, setBundlePrice] = useState('');
 const [minSpend, setMinSpend] = useState('');
 const [giftProductId, setGiftProductId] = useState('');
 const [activeDays, setActiveDays] = useState<string[]>([]);
 const [activeTimeStart, setActiveTimeStart] = useState('');
 const [activeTimeEnd, setActiveTimeEnd] = useState('');
 const [showCountdown, setShowCountdown] = useState(false);

 // MARKETING-002: SaaS gating — which campaign types this branch's package allows.
 const [capabilities, setCapabilities] = useState<{ enabled: boolean; allowedCampaignTypes: string[] } | null>(null);
 useEffect(() => {
 if (!selectedBranchId) return;
 apiFetch(`/marketing/capabilities?store_id=${selectedBranchId}`)
 .then(res => res.ok ? res.json() : null)
 .then(setCapabilities)
 .catch(() => setCapabilities(null));
 }, [selectedBranchId]);

 useEffect(() => {
 fetchCampaigns();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [selectedBranchId]);

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
 const res = await apiFetch(`/marketing/social/status?branchId=${selectedBranchId}`);
 if (res.ok) {
 const data = await res.json();
 setFbLinked(data.is_facebook_connected || false);
 setIgLinked(data.is_instagram_connected || false);
 }
 } catch (e) { console.error(e); }
 };

 const handleSelectPage = async (page: any) => {
 if (oauthPlatform === 'facebook') {
 await apiFetch('/marketing/social/facebook/select', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ branchId: selectedBranchId, pageId: page.id, pageName: page.name, token: oauthToken })
 });
 setFbLinked(true);
 } else {
 await apiFetch('/marketing/social/instagram/select', {
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
 apiFetch(`/marketing/social/facebook/disconnect?branchId=${selectedBranchId}`, { method: 'DELETE' })
 .then(() => setFbLinked(false));
 } else {
 window.location.href = `${BACKEND_URL}/marketing/social/facebook/connect?branchId=${selectedBranchId}`;
 }
 };

 const handleInstagramConnect = () => {
 if (!selectedBranchId) return alert('Select a branch first');
 if (igLinked) {
 apiFetch(`/marketing/social/instagram/disconnect?branchId=${selectedBranchId}`, { method: 'DELETE' })
 .then(() => setIgLinked(false));
 } else {
 window.location.href = `${BACKEND_URL}/marketing/social/instagram/connect?branchId=${selectedBranchId}`;
 }
 };

 const fetchCampaigns = async () => {
 try {
 // Was never scoped by branch at all -- returned every campaign in the
 // whole system regardless of which branch was selected, which is why
 // Baghbanpura's Active Campaigns tab showed Masjid-e-Taqwa's campaigns.
 // A brand-wide campaign still correctly shows under every branch of
 // that same brand (see MarketingService.getCampaigns) -- only a
 // campaign scoped to a DIFFERENT specific branch stops appearing.
 const campaignQuery = selectedBranchId ? `?store_id=${selectedBranchId}` : '';
 const [res, res2, res4, res5] = await Promise.all([
 apiFetch(`/marketing/campaign${campaignQuery}`),
 apiFetch('/marketing/schedule'),
 apiFetch('/catalog/categories'),
 apiFetch('/catalog/products'),
 ]);
 if (res.ok) {
 const data = await res.json();
 setCampaigns(data.map((c: any) => ({ ...c, is_paused: c.status === 'PAUSED' })));
 }
 if (res2.ok) setScheduledCampaigns(await res2.json());
 if (res4.ok) setCategories(await res4.json());
 if (res5.ok) setProducts(await res5.json());
 await fetchKpis();
 } catch (e) { console.error(e); }
 };

 const fetchKpis = async () => {
 try {
 const params = new URLSearchParams({ preset: kpiPreset });
 if (kpiPreset === 'custom') {
 if (kpiFrom) params.set('from', kpiFrom);
 if (kpiTo) params.set('to', kpiTo);
 }
 const res = await apiFetch(`/marketing/kpis?${params.toString()}`);
 if (res.ok) setKpis(await res.json());
 } catch (e) { console.error(e); }
 };

 useEffect(() => { fetchKpis(); }, [kpiPreset, kpiFrom, kpiTo]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const discountRequired = ['PERCENTAGE'].includes(campaignType) || (campaignType === 'BOGO' && rewardType === 'PERCENTAGE');
 if (!title || (discountRequired && !discountPct)) return;
 setIsSubmitting(true);
 setSuccessMsg('');

 try {
 const formData = new FormData();
 formData.append('title', title);
 formData.append('discount_pct', discountPct || '0');
 formData.append('campaign_type', campaignType);
 formData.append('priority', priority);
 formData.append('allow_stacking', String(allowStacking));
 if (campaignType === 'FLAT') formData.append('flat_discount_amount', flatDiscountAmount);
 if (campaignType === 'BOGO') {
 formData.append('buy_product_id', buyProductId);
 formData.append('buy_qty', buyQty);
 formData.append('get_product_id', getProductId);
 formData.append('reward_type', rewardType);
 formData.append('reward_qty', rewardQty);
 }
 if (['BUNDLE', 'COMBO'].includes(campaignType)) {
 bundleProductIds.forEach(id => formData.append('bundle_product_ids', String(id)));
 formData.append('bundle_price', bundlePrice);
 }
 if (campaignType === 'FREE_GIFT') {
 formData.append('min_spend', minSpend);
 formData.append('gift_product_id', giftProductId);
 }
 if (activeDays.length > 0) formData.append('active_days', activeDays.join(','));
 if (activeTimeStart) formData.append('active_time_start', activeTimeStart);
 if (activeTimeEnd) formData.append('active_time_end', activeTimeEnd);
 formData.append('show_countdown', String(showCountdown));
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
 formData.append('published_facebook', String(publishFacebook));
 formData.append('published_instagram', String(publishInstagram));
 formData.append('published_tv', String(publishTv));
 targetStoreIds.forEach(id => formData.append('target_store_ids', String(id)));
 targetCategoryIds.forEach(id => formData.append('target_category_ids', String(id)));
 targetProductIds.forEach(id => formData.append('target_product_ids', String(id)));
 }

 const res = await apiFetch(endpoint, {
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
 setPublishFacebook(false);
 setPublishInstagram(false);
 setPublishTv(false);
 setImageFile(null);
 setTargetStoreIds(defaultTargetStoreIds());
 setTargetCategoryIds([]);
 setTargetProductIds([]);
 resetBogoFields();
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
 formData.append('published_facebook', String(publishFacebook));
 formData.append('published_instagram', String(publishInstagram));
 formData.append('published_tv', String(publishTv));
 if (activeBrandId) formData.append('brand_id', String(activeBrandId));
 targetStoreIds.forEach(id => formData.append('target_store_ids', String(id)));
 targetCategoryIds.forEach(id => formData.append('target_category_ids', String(id)));
 targetProductIds.forEach(id => formData.append('target_product_ids', String(id)));

 const res = await apiFetch(`/marketing/schedule`, {
 method: 'POST',
 body: formData
 });
 if (res.ok) {
 setSuccessMsg('Deal scheduled successfully! It will automatically launch on the start date.');
 await fetchCampaigns();
 setTitle(''); setDescription(''); setDiscountPct('');
 setStartDate(''); setEndDate(''); setImageFile(null);
 setTargetStoreIds(defaultTargetStoreIds());
 setTargetCategoryIds([]);
 setTargetProductIds([]);
 resetBogoFields();
 } else {
 const err = await res.json().catch(() => null);
 setSuccessMsg(err?.message || `Failed to schedule deal (HTTP ${res.status}).`);
 }
 } else {
 // ── CREATE new campaign ──
 if (description) formData.append('description', description);
 formData.append('published_web', String(publishWeb));
 formData.append('published_pos', String(publishPos));
 formData.append('published_facebook', String(publishFacebook));
 formData.append('published_instagram', String(publishInstagram));
 formData.append('published_tv', String(publishTv));
 if (activeBrandId) formData.append('brand_id', String(activeBrandId));
 targetStoreIds.forEach(id => formData.append('target_store_ids', String(id)));
 targetCategoryIds.forEach(id => formData.append('target_category_ids', String(id)));
 targetProductIds.forEach(id => formData.append('target_product_ids', String(id)));

 const res = await apiFetch(`/marketing/campaign`, {
 method: 'POST',
 body: formData
 });
 if (res.ok) {
 const result = await res.json().catch(() => null);
 setSuccessMsg(
 result?.warnings?.length > 0
 ? `Campaign launched — but note: ${result.warnings.join(' ')}`
 : 'Campaign launched successfully!'
 );
 await fetchCampaigns();
 setTitle(''); setDescription(''); setDiscountPct('');
 setPublishWeb(true); setPublishPos(true); setPublishFacebook(false); setPublishInstagram(false); setPublishTv(false);
 setImageFile(null);
 setTargetStoreIds(defaultTargetStoreIds());
 resetBogoFields();
 } else {
 const err = await res.json().catch(() => null);
 setSuccessMsg(err?.message || `Failed to launch campaign (HTTP ${res.status}).`);
 }
 }
 } catch (err: any) {
 console.error(err);
 setSuccessMsg(err?.message || 'Network error — failed to reach the server.');
 } finally {
 setIsSubmitting(false);
 }
 };

 const resetBogoFields = () => {
 setCampaignType('PERCENTAGE');
 setFlatDiscountAmount('');
 setBuyProductId('');
 setBuyQty('1');
 setGetProductId('');
 setRewardType('FREE');
 setRewardQty('1');
 setPriority('0');
 setAllowStacking(false);
 setBundleProductIds([]);
 setBundlePrice('');
 setMinSpend('');
 setGiftProductId('');
 setActiveDays([]);
 setActiveTimeStart('');
 setActiveTimeEnd('');
 setShowCountdown(false);
 };

 const handleEdit = (camp: any) => {
 setEditingId(camp.id);
 setTitle(camp.title);
 setDescription(camp.description || '');
 setDiscountPct(String(camp.discount_pct));
 setPublishWeb(camp.published_web);
 setPublishPos(camp.published_pos);
 setPublishFacebook(camp.published_facebook || false);
 setPublishInstagram(camp.published_instagram || false);
 setPublishTv(camp.published_tv || false);
 setTargetStoreIds(camp.target_stores?.map((s:any) => s.id) || []);
 setTargetCategoryIds(camp.target_categories?.map((c:any) => c.id) || []);
 setTargetProductIds(camp.target_products?.map((p:any) => p.id) || []);
 setCampaignType(camp.campaign_type || 'PERCENTAGE');
 setFlatDiscountAmount(camp.flat_discount_amount ? String(camp.flat_discount_amount) : '');
 setBuyProductId(camp.buy_product_id ? String(camp.buy_product_id) : '');
 setBuyQty(String(camp.buy_qty || 1));
 setGetProductId(camp.get_product_id ? String(camp.get_product_id) : '');
 setRewardType(camp.reward_type || 'FREE');
 setRewardQty(String(camp.reward_qty || 1));
 setPriority(String(camp.priority || 0));
 setAllowStacking(camp.allow_stacking || false);
 setBundleProductIds(camp.bundle_products?.map((p: any) => p.id) || []);
 setBundlePrice(camp.bundle_price ? String(camp.bundle_price) : '');
 setMinSpend(camp.min_spend ? String(camp.min_spend) : '');
 setGiftProductId(camp.gift_product_id ? String(camp.gift_product_id) : '');
 setActiveDays(camp.active_days ? camp.active_days.split(',') : []);
 setActiveTimeStart(camp.active_time_start || '');
 setActiveTimeEnd(camp.active_time_end || '');
 setShowCountdown(camp.show_countdown || false);
 setIsScheduled(false);
 setSuccessMsg('');
 setImageFile(null);
 setActiveTab('create');
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
 setActiveTab('create');
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
 setPublishFacebook(false);
 setPublishInstagram(false);
 setPublishTv(false);
 setStartDate('');
 setEndDate('');
 setIsScheduled(false);
 setTargetStoreIds(defaultTargetStoreIds());
 setTargetCategoryIds([]);
 setTargetProductIds([]);
 setSuccessMsg('');
 setImageFile(null);
 resetBogoFields();
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
 const endpoint = isScheduled ? `/marketing/schedule` : `/marketing/campaign`;
 const res = await apiFetch(`${endpoint}/${deleteConfirmId}`, { 
 method: 'DELETE'
 });
 
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

 // MARKETING-003 §10/§11/§16 — Campaign History (audit log + versions) and Multi-Branch Cloning
 const [historyModal, setHistoryModal] = useState<{ campaign: any; logs: any[]; versions: any[] } | null>(null);

 const handleShowHistory = async (camp: any) => {
 try {
 const res = await apiFetch(`/marketing/campaign/${camp.id}/history`);
 if (res.ok) {
 const data = await res.json();
 setHistoryModal({ campaign: camp, logs: data.logs || [], versions: data.versions || [] });
 }
 } catch (e) { console.error(e); }
 };

 const handleRollback = async (campaignId: number, version: number) => {
 try {
 await apiFetch(`/marketing/campaign/${campaignId}/rollback/${version}`, { method: 'POST' });
 setHistoryModal(null);
 await fetchCampaigns();
 } catch (e) { console.error(e); }
 };

 const handleClone = async (camp: any) => {
 try {
 await apiFetch(`/marketing/campaign/${camp.id}/clone`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ target_store_ids: selectedBranchId ? [selectedBranchId] : 'ALL' }),
 });
 setSuccessMsg('Campaign cloned (paused) — review and resume it when ready.');
 await fetchCampaigns();
 } catch (e) { console.error(e); }
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
 if (isScheduledType) {
 await apiFetch(`/marketing/schedule/${camp.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_active: !newPausedState }),
 });
 } else {
 // MARKETING-003: real pause/resume endpoints (audit-logged), replacing
 // the previous no-op PATCH with a nonexistent `is_paused` field.
 await apiFetch(`/marketing/campaign/${camp.id}/${newPausedState ? 'pause' : 'resume'}`, { method: 'POST' });
 }
 } catch (e) {
 if (isScheduledType) {
 setScheduledCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_active: camp.is_active } : c));
 } else {
 setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, is_paused: camp.is_paused } : c));
 }
 console.error(e); 
 }
 };

 const totalCampaigns = campaigns.filter(c => c.status === 'RUNNING').length;
 const { ctr, conversionRate, totalRevenue, totalOrders, aov, roi } = kpis;
 return (
 <>
 <div className="animate-fade-in max-w-7xl w-full mx-auto space-y-6">
 <div id="campaign-form-top" className="mb-8">
 <h2 className="text-3xl font-black text-stitch-ink flex items-center gap-3">
 <Megaphone className="text-stitch-accent" size={32} /> Marketing & Campaigns
 </h2>
 <p className="text-stitch-muted text-sm mt-1">Create deals and push them to POS, Website, and Social Media instantly.</p>
 </div>

 <div className="flex flex-wrap gap-2 border-b border-stitch-border pb-1">
 {([
 ['create', editingId ? '✏️ Edit Deal' : 'Create Campaign', Tag],
 ['campaigns', 'Active Campaigns', Megaphone],
 ['social', 'Social & Publishing', Share2],
 ['analytics', 'Analytics', TrendingUp],
 ] as const).map(([key, label, Icon]) => (
 <button
 key={key}
 type="button"
 onClick={() => setActiveTab(key)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-bold transition-colors border-b-2 ${
 activeTab === key
 ? 'text-stitch-accent border-stitch-accent bg-stitch-accent/10'
 : 'text-stitch-muted border-transparent hover:text-stitch-ink hover:bg-stitch-surface'
 }`}
 >
 <Icon size={16} /> {label}
 </button>
 ))}
 </div>

 {activeTab === 'create' && (
 <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 {/* Deal Creator / Editor Form */}
 <div className={`flex flex-col border rounded-2xl p-6 transition-all ${editingId ? 'bg-stitch-card border-stitch-accent/50 ring-2 ring-stitch-accent/20' : 'bg-stitch-panel border-stitch-border'}`}>
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
 <Tag size={20} className={editingId ? 'text-stitch-accent' : 'text-stitch-accent'} />
 {editingId ? '✏️ Edit Deal' : 'Create New Deal'}
 </h3>
 {editingId && (
 <button
 type="button"
 onClick={handleCancelEdit}
 className="text-xs font-bold text-stitch-muted hover:text-stitch-ink bg-stitch-surface hover:bg-stitch-card px-3 py-1.5 rounded-lg transition-all"
 >
 ✕ Cancel Edit
 </button>
 )}
 </div>

 <div className="space-y-5">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Campaign Title</label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="e.g. Summer Weekend BOGO"
 className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors text-sm"
 required
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Description</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Details for the customer..."
 className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors h-20 resize-none text-sm"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Banner Image (Optional)</label>
 <div className="relative">
 <ImagePlus size={16} className="absolute left-4 top-3.5 text-stitch-muted" />
 <input
 type="file"
 accept="image/*"
 onChange={(e) => {
 if (e.target.files && e.target.files.length > 0) {
 setImageFile(e.target.files[0]);
 }
 }}
 className="w-full bg-stitch-surface border border-stitch-border rounded-lg pl-10 pr-3 py-1.5 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stitch-accent file:text-stitch-accent-ink hover:file:bg-stitch-accent-hover cursor-pointer"
 />
 </div>
 <p className="text-xs text-stitch-muted mt-1">Recommended size: 1080x1440 (Vertical). Will be displayed on TV Board and POS.</p>
 </div>

 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Campaign Type</label>
 <div className="flex flex-wrap gap-2">
 {([
 ['PERCENTAGE', 'Percentage Discount'],
 ['FLAT', 'Flat Discount'],
 ['BOGO', 'Buy One Get One'],
 ['BUY_X_GET_Y', 'Buy X Get Y (Foundation)'],
 ['BUNDLE', 'Bundle Deal (Foundation)'],
 ['COMBO', 'Combo Meal (Future)'],
 ['FREE_GIFT', 'Free Gift (Future)'],
 ] as const).map(([value, label]) => {
 const isAllowed = !capabilities || capabilities.allowedCampaignTypes.includes(value);
 return (
 <label
 key={value}
 title={isAllowed ? undefined : 'Not included in this branch\'s current package — upgrade to unlock'}
 className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
 !isAllowed ? 'opacity-40 cursor-not-allowed bg-stitch-surface text-stitch-muted border-stitch-border' :
 campaignType === value ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent cursor-pointer' : 'bg-stitch-surface text-stitch-muted border-stitch-border cursor-pointer'
 }`}
 >
 <input
 type="radio"
 className="hidden"
 disabled={!isAllowed}
 checked={campaignType === value}
 onChange={() => {
 if (!isAllowed) return;
 // A leftover discountPct from a prior PERCENTAGE (or BOGO-with-%
 // reward) edit used to silently persist across a type switch and
 // get submitted/displayed on campaign types where it's meaningless
 // (e.g. a FREE-reward BOGO showing a stale "15% OFF" badge) — clear
 // it whenever it stops being relevant for the newly selected type.
 if (value !== 'PERCENTAGE' && !(value === 'BOGO' && rewardType === 'PERCENTAGE')) {
 setDiscountPct('');
 }
 setCampaignType(value);
 }}
 />
 {label}{!isAllowed && ' 🔒'}
 </label>
 );
 })}
 </div>
 </div>

 {campaignType === 'PERCENTAGE' && (
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Discount Percentage (%)</label>
 <div className="relative">
 <Percent size={16} className="absolute left-4 top-3.5 text-stitch-muted" />
 <input
 type="number"
 value={discountPct}
 onChange={(e) => setDiscountPct(e.target.value)}
 placeholder="20"
 max="100"
 min="1"
 className="w-full bg-stitch-surface border border-stitch-border rounded-lg pl-10 pr-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors text-sm"
 required
 />
 </div>
 </div>
 )}

 {campaignType === 'FLAT' && (
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Flat Discount Amount (Rs.)</label>
 <input
 type="number"
 value={flatDiscountAmount}
 onChange={(e) => setFlatDiscountAmount(e.target.value)}
 placeholder="200"
 min="1"
 className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors text-sm"
 required
 />
 </div>
 )}

 {campaignType === 'BOGO' && (
 <div className="bg-stitch-surface border border-stitch-border rounded-lg p-4 space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Buy Product</label>
 <select value={buyProductId} onChange={(e) => setBuyProductId(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" required>
 <option value="">Select product...</option>
 {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Required Quantity</label>
 <input type="number" min="1" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Get Product</label>
 <select value={getProductId} onChange={(e) => setGetProductId(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" required>
 <option value="">Select product...</option>
 {products.filter((p: any) => String(p.id) !== buyProductId).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Reward Quantity</label>
 <input type="number" min="1" value={rewardQty} onChange={(e) => setRewardQty(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3 items-end">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Reward Type</label>
 <select value={rewardType} onChange={(e) => {
 const next = e.target.value as 'FREE' | 'PERCENTAGE';
 if (next === 'FREE') setDiscountPct('');
 setRewardType(next);
 }} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm">
 <option value="FREE">Free</option>
 <option value="PERCENTAGE">Percentage Discount</option>
 </select>
 </div>
 {rewardType === 'PERCENTAGE' && (
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Discount % on Get Product</label>
 <input type="number" min="1" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" />
 </div>
 )}
 </div>
 <p className="text-xs text-stitch-muted">e.g. Buy 2 Shawarmas, Get 1 Pepsi Free — auto-applies at checkout when both items are in the cart.</p>
 </div>
 )}

 {['BUNDLE', 'COMBO'].includes(campaignType) && (
 <div className="bg-stitch-surface border border-stitch-border rounded-lg p-4 space-y-3">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Bundle Products (e.g. Burger + Fries + Drink)</label>
 <select
 multiple
 value={bundleProductIds.map(String)}
 onChange={(e) => setBundleProductIds(Array.from(e.target.selectedOptions).map(o => Number(o.value)))}
 className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm h-32 font-mono"
 >
 {products.map((p: any) => (
 <option key={p.id} value={p.id}>
 {p.name} — Sell: Rs.{p.price ?? 0} / Cost: Rs.{p.cost ?? 0}
 </option>
 ))}
 </select>
 <p className="text-xs text-stitch-muted mt-1">Ctrl/Cmd-click to select multiple products.</p>
 </div>
 {bundleProductIds.length > 0 && (() => {
 const selectedProducts = products.filter((p: any) => bundleProductIds.includes(p.id));
 const totalSell = selectedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
 const totalCost = selectedProducts.reduce((sum: number, p: any) => sum + (p.cost || 0), 0);
 const bundlePriceNum = Number(bundlePrice) || 0;
 const bundleMargin = bundlePriceNum > 0 ? (((bundlePriceNum - totalCost) / bundlePriceNum) * 100).toFixed(1) : null;
 return (
 <div className="bg-stitch-panel border border-stitch-border rounded-lg p-3 text-xs space-y-1">
 <div className="flex justify-between text-stitch-muted">
 <span>Selected items — combined selling price:</span>
 <span className="font-bold text-stitch-ink">Rs. {totalSell.toFixed(0)}</span>
 </div>
 <div className="flex justify-between text-stitch-muted">
 <span>Combined cost:</span>
 <span className="font-bold">Rs. {totalCost.toFixed(0)}</span>
 </div>
 {bundlePriceNum > 0 && (
 <>
 <div className="flex justify-between text-stitch-accent">
 <span>Discount vs buying separately:</span>
 <span className="font-bold">Rs. {Math.max(0, totalSell - bundlePriceNum).toFixed(0)}</span>
 </div>
 <div className="flex justify-between text-stitch-success">
 <span>Your margin at this bundle price:</span>
 <span className="font-bold">{bundleMargin}%</span>
 </div>
 </>
 )}
 </div>
 );
 })()}
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Fixed Bundle Price (Rs.)</label>
 <input type="number" min="1" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" required />
 </div>
 <p className="text-xs text-stitch-muted">Auto-detected when all selected products are in the cart together — the line total becomes the fixed bundle price.</p>
 </div>
 )}

 {campaignType === 'FREE_GIFT' && (
 <div className="bg-stitch-surface border border-stitch-border rounded-lg p-4 space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Minimum Spend (Rs.)</label>
 <input type="number" min="1" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} placeholder="3000" className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" required />
 </div>
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Free Gift Product</label>
 <select value={giftProductId} onChange={(e) => setGiftProductId(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" required>
 <option value="">Select product...</option>
 {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 </div>
 <p className="text-xs text-stitch-muted">e.g. Spend Rs.3000, get a free Dessert — the gift automatically appears once the cart qualifies.</p>
 </div>
 )}

 <div className="bg-stitch-surface border border-stitch-border rounded-lg p-4 space-y-3">
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider">Active Time Window (Optional — Happy Hours)</label>
 <div className="flex flex-wrap gap-2">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
 <label key={day} className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${activeDays.includes(day) ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent' : 'bg-stitch-panel text-stitch-muted border-stitch-border'}`}>
 <input type="checkbox" className="hidden" checked={activeDays.includes(day)} onChange={() => setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} />
 {day}
 </label>
 ))}
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs text-stitch-muted mb-1">Start Time</label>
 <input type="time" value={activeTimeStart} onChange={(e) => setActiveTimeStart(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" />
 </div>
 <div>
 <label className="block text-xs text-stitch-muted mb-1">End Time</label>
 <input type="time" value={activeTimeEnd} onChange={(e) => setActiveTimeEnd(e.target.value)} className="w-full bg-stitch-panel border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink text-sm" />
 </div>
 </div>
 <label className="flex items-center gap-2 text-sm font-bold text-stitch-ink cursor-pointer">
 <input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} className="accent-stitch-accent w-4 h-4" />
 Show countdown timer to customers
 </label>
 <p className="text-xs text-stitch-muted">Leave blank for no time restriction — the campaign runs for its whole scheduled duration. e.g. days=Fri,Sat + 2pm-5pm for a weekend happy hour.</p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Priority</label>
 <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent transition-colors text-sm" />
 <p className="text-xs text-stitch-muted mt-1">Higher priority wins when multiple campaigns match the same item.</p>
 </div>
 <div className="flex items-end pb-2">
 <label className="flex items-center gap-2 text-sm font-bold text-stitch-ink cursor-pointer">
 <input type="checkbox" checked={allowStacking} onChange={(e) => setAllowStacking(e.target.checked)} className="accent-stitch-accent w-4 h-4" />
 Allow stacking with other campaigns
 </label>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-2">Target Branches, Categories & Items</label>
 <div className="w-full bg-stitch-surface border border-stitch-border rounded-lg p-2 text-stitch-ink max-h-48 overflow-y-auto flex flex-col gap-1">
 {(() => {
 const displayStores = isBranchEntered && selectedBranchId ? branches.filter(s => s.id === Number(selectedBranchId)) : branches;
 return displayStores.length === 0 ? (
 <span className="text-sm text-stitch-muted">No branches found.</span>
 ) : displayStores.map(s => {
 const isStoreExpanded = expandedStores.includes(s.id);
 return (
 <div key={`store-${s.id}`} className="flex flex-col">
 <div className="flex items-center gap-2 hover:bg-stitch-surface p-1.5 rounded">
 <button type="button" onClick={() => setExpandedStores(prev => isStoreExpanded ? prev.filter(id => id !== s.id) : [...prev, s.id])} className="p-1 hover:bg-stitch-card rounded text-stitch-muted">
 {isStoreExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
 </button>
 <label className="flex items-center gap-2 cursor-pointer flex-1">
 <input
 type="checkbox"
 checked={targetStoreIds.includes(s.id)}
 onChange={(e) => {
 const validCats = categories.filter(c => !['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase()));
 const catIds = validCats.map(c => c.id);
 const pIds = products.filter(p => p.categories?.some((cat: any) => catIds.includes(cat.id))).map(p => p.id);
 
 if (e.target.checked) {
 setTargetStoreIds([...targetStoreIds, s.id]);
 if (!expandedStores.includes(s.id)) setExpandedStores([...expandedStores, s.id]);
 setTargetCategoryIds(prev => Array.from(new Set([...prev, ...catIds])));
 setExpandedCategories(prev => Array.from(new Set([...prev, ...catIds])));
 setTargetProductIds(prev => Array.from(new Set([...prev, ...pIds])));
 } else {
 setTargetStoreIds(targetStoreIds.filter(id => id !== s.id));
 setTargetCategoryIds(prev => prev.filter(id => !catIds.includes(id)));
 setTargetProductIds(prev => prev.filter(id => !pIds.includes(id)));
 }
 }}
 className="accent-stitch-accent"
 />
 <span className="text-sm font-bold">{s.name}</span>
 </label>
 </div>
 {isStoreExpanded && (
 <div className="ml-6 pl-2 border-l border-stitch-border flex flex-col gap-1 mt-1">
 {categories.filter(c => !['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase())).map(c => {
 const isCatExpanded = expandedCategories.includes(c.id);
 return (
 <div key={`cat-${c.id}`} className="flex flex-col">
 <div className="flex items-center gap-2 hover:bg-stitch-surface p-1.5 rounded">
 <button type="button" onClick={() => setExpandedCategories(prev => isCatExpanded ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="p-1 hover:bg-stitch-card rounded text-stitch-muted">
 {isCatExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
 </button>
 <label className="flex items-center gap-2 cursor-pointer flex-1">
 <input
 type="checkbox"
 checked={targetCategoryIds.includes(c.id)}
 onChange={(e) => {
 const pIds = products.filter(p => p.categories?.some((cat: any) => cat.id === c.id)).map(p => p.id);
 if (e.target.checked) {
 setTargetCategoryIds([...targetCategoryIds, c.id]);
 if (!expandedCategories.includes(c.id)) setExpandedCategories([...expandedCategories, c.id]);
 setTargetProductIds(prev => Array.from(new Set([...prev, ...pIds])));
 } else {
 setTargetCategoryIds(targetCategoryIds.filter(id => id !== c.id));
 setTargetProductIds(prev => prev.filter(id => !pIds.includes(id)));
 }
 }}
 className="accent-stitch-accent"
 />
 <span className="text-sm text-stitch-muted">{c.name}</span>
 </label>
 </div>
 {isCatExpanded && (
 <div className="ml-6 pl-2 border-l border-stitch-border flex flex-col gap-1 mt-1">
 {products.filter(p => p.categories?.some((cat: any) => cat.id === c.id)).map(p => (
 <label key={`prod-${p.id}`} className="flex items-center gap-2 hover:bg-stitch-surface p-1.5 rounded cursor-pointer">
 <input
 type="checkbox"
 checked={targetProductIds.includes(p.id)}
 onChange={(e) => {
 if (e.target.checked) setTargetProductIds([...targetProductIds, p.id]);
 else setTargetProductIds(targetProductIds.filter(id => id !== p.id));
 }}
 className="accent-stitch-accent ml-4"
 />
 <span className="text-sm text-stitch-muted">{p.name}</span>
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
 {targetStoreIds.length === 0 ? (
 <p className="text-[11px] text-amber-400 mt-2 font-bold">⚠ No branch selected — this deal will apply to EVERY branch of this brand.</p>
 ) : (
 <p className="text-[11px] text-stitch-muted mt-2 font-medium">If no category/item is selected, the deal applies to all items at the selected branch(es).</p>
 )}
 </div>
 </div>
 </div>

 <div className="flex flex-col p-6 bg-stitch-panel border border-stitch-border rounded-2xl">
 <div className="flex-1">
 <label className="flex items-center gap-3 cursor-pointer mb-6">
 <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="w-4 h-4 rounded-sm accent-stitch-accent" />
 <span className="text-sm font-bold text-stitch-ink">Schedule for later (Automated)</span>
 </label>

 {isScheduled && (
 <div className="grid grid-cols-2 gap-4 animate-fade-in mb-6">
 <div>
 <label className="block text-xs font-bold text-stitch-muted mb-2">Start Date</label>
 <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent text-sm" required={isScheduled} />
 </div>
 <div>
 <label className="block text-xs font-bold text-stitch-muted mb-2">End Date</label>
 <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-stitch-surface border border-stitch-border rounded-lg px-3 py-2 text-stitch-ink focus:outline-none focus:border-stitch-accent text-sm" required={isScheduled} />
 </div>
 </div>
 )}

 <label className="block text-xs font-bold text-stitch-muted uppercase tracking-wider mb-3">Publish To</label>
 <div className="flex flex-col gap-2.5 mb-8">
 <label className="flex items-center gap-3 bg-stitch-surface px-4 py-2.5 rounded-lg border border-stitch-border cursor-pointer hover:border-stitch-accent transition-colors">
 <input type="checkbox" checked={publishWeb} onChange={(e) => setPublishWeb(e.target.checked)} className="w-4 h-4 rounded-sm accent-stitch-accent" />
 <div className="flex items-center gap-2"><Globe size={16} className="text-stitch-accent" /> <span className="text-sm font-bold text-stitch-ink">Website</span></div>
 </label>

 <label className="flex items-center gap-3 bg-stitch-surface px-4 py-2.5 rounded-lg border border-stitch-border cursor-pointer hover:border-[#fbbf24] transition-colors">
 <input type="checkbox" checked={publishPos} onChange={(e) => setPublishPos(e.target.checked)} className="w-4 h-4 rounded-sm accent-[#fbbf24]" />
 <div className="flex items-center gap-2"><Store size={16} className="text-[#fbbf24]" /> <span className="text-sm font-bold text-stitch-ink">POS System</span></div>
 </label>

 <label className="flex items-center gap-3 bg-stitch-surface px-4 py-2.5 rounded-lg border border-stitch-border cursor-pointer hover:border-stitch-accent transition-colors">
 <input type="checkbox" checked={publishTv} onChange={(e) => setPublishTv(e.target.checked)} className="w-4 h-4 rounded-sm accent-stitch-accent" />
 <div className="flex items-center gap-2 text-stitch-ink font-bold text-sm">
 <Megaphone size={16} className="text-stitch-accent" /> TV Board
 </div>
 </label>

 {(igLinked || true) && (
 <label className="flex items-center gap-3 bg-stitch-surface px-4 py-2.5 rounded-lg border border-stitch-border cursor-pointer hover:border-stitch-accent transition-colors">
 <input type="checkbox" checked={publishInstagram} onChange={(e) => setPublishInstagram(e.target.checked)} className="w-4 h-4 rounded-sm accent-stitch-accent" />
 <div className="flex items-center gap-2 text-stitch-ink font-bold text-sm">
 <InstagramIcon size={16} /> Instagram
 </div>
 </label>
 )}

 {(fbLinked || true) && (
 <label className="flex items-center gap-3 bg-stitch-surface px-4 py-2.5 rounded-lg border border-stitch-border cursor-pointer hover:border-stitch-accent transition-colors">
 <input type="checkbox" checked={publishFacebook} onChange={(e) => setPublishFacebook(e.target.checked)} className="w-4 h-4 rounded-sm accent-stitch-accent" />
 <div className="flex items-center gap-2 text-stitch-ink font-bold text-sm">
 <FacebookIcon size={16} /> Facebook
 </div>
 </label>
 )}
 </div>

 {successMsg && (() => {
 const isError = /fail|error|not included|required|denied/i.test(successMsg);
 return (
 <div className={`p-3 mb-4 rounded-xl text-sm font-bold flex items-center gap-2 ${isError ? 'bg-stitch-danger/20 border border-stitch-danger/50 text-stitch-danger' : 'bg-stitch-success/20 border border-stitch-success/50 text-stitch-success'}`}>
 {isError ? <X size={18} /> : <CheckCircle size={18} />} {successMsg}
 </div>
 );
 })()}

 <button
 type="submit"
 disabled={isSubmitting}
 className={`w-full font-bold py-3 rounded-xl transition-all mt-auto ${
 editingId
 ? 'bg-gradient-to-r from-stitch-accent-deep to-stitch-accent hover:opacity-90 text-stitch-accent-ink'
 : 'bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink accent-glow-hover'
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
 </div>
 </div>
 </form>
 )}

 {activeTab === 'social' && (
 <div className="max-w-2xl">
 <div className="p-6 bg-stitch-panel border border-stitch-border rounded-2xl">
 <h3 className="text-lg font-bold text-stitch-ink mb-4 flex items-center gap-2">
 <Share2 size={20} className="text-stitch-accent" /> Social Media Integration
 </h3>
 <p className="text-sm text-stitch-muted mb-6">Link your branch's social media accounts to auto-post campaigns and deals.</p>
 <div className="grid grid-cols-2 gap-4">
 <button
 onClick={handleFacebookConnect}
 className={`flex items-center justify-between p-4 rounded-xl border font-bold transition-all ${fbLinked ? 'bg-stitch-accent/20 border-stitch-accent text-stitch-accent' : 'bg-stitch-surface border-stitch-border text-stitch-muted hover:border-stitch-accent/50'}`}
 >
 <div className="flex items-center gap-2"><FacebookIcon size={20} /> Facebook Page</div>
 {fbLinked ? <span className="text-xs bg-stitch-accent-stitch-accent-ink px-2 py-1 rounded">Linked</span> : <span className="text-xs">Connect</span>}
 </button>
 <button
 onClick={handleInstagramConnect}
 className={`flex items-center justify-between p-4 rounded-xl border font-bold transition-all ${igLinked ? 'bg-stitch-accent/20 border-stitch-accent text-stitch-accent' : 'bg-stitch-surface border-stitch-border text-stitch-muted hover:border-stitch-accent/50'}`}
 >
 <div className="flex items-center gap-2"><InstagramIcon size={20} /> Instagram Account</div>
 {igLinked ? <span className="text-xs bg-stitch-accent-stitch-accent-ink px-2 py-1 rounded">Linked</span> : <span className="text-xs">Connect</span>}
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'analytics' && (
 <div>
 <div className="p-6 bg-stitch-panel border border-stitch-border rounded-2xl">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-lg font-bold text-stitch-ink flex items-center gap-2">
 <Share2 size={20} className="text-stitch-accent" /> Marketing Overview
 </h3>
 <select value={kpiPreset} onChange={(e) => setKpiPreset(e.target.value)} className="bg-stitch-surface border border-stitch-border text-xs text-stitch-muted p-1.5 rounded outline-none">
 <option value="today">Today</option>
 <option value="yesterday">Yesterday</option>
 <option value="this_week">This Week</option>
 <option value="last_week">Last Week</option>
 <option value="this_month">This Month</option>
 <option value="last_month">Last Month</option>
 <option value="custom">Custom Range</option>
 </select>
 </div>

 {kpiPreset === 'custom' && (
 <div className="flex gap-3 mb-4">
 <input type="date" value={kpiFrom} onChange={(e) => setKpiFrom(e.target.value)} className="bg-stitch-surface border border-stitch-border text-xs text-stitch-ink p-2 rounded outline-none" />
 <input type="date" value={kpiTo} onChange={(e) => setKpiTo(e.target.value)} className="bg-stitch-surface border border-stitch-border text-xs text-stitch-ink p-2 rounded outline-none" />
 </div>
 )}

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <Megaphone size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">{kpis?.activeCampaigns ?? totalCampaigns}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Active Campaigns</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <Users size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">{kpis?.impressions || 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Impressions</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <Target size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">{kpis?.orders ?? kpis?.totalOrders ?? 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Orders</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-success/10 border border-stitch-success/20 flex items-center justify-center">
 <TrendingUp size={16} className="text-stitch-success" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">Rs.{kpis?.revenue ?? kpis?.totalRevenue ?? 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Revenue Generated</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <Tag size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">{kpis?.unitsSold ?? 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Units Sold (approx.)</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-danger/10 border border-stitch-danger/20 flex items-center justify-center">
 <Percent size={16} className="text-stitch-danger" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">Rs.{kpis?.discountGiven ?? 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Discount Given</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <Activity size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">Rs.{kpis?.averageOrderValue ?? kpis?.aov ?? 0}</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Avg Order Value</div>
 </div>
 </div>

 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-border flex flex-col justify-center items-center text-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stitch-accent/10 border border-stitch-accent/20 flex items-center justify-center">
 <MousePointer2 size={16} className="text-stitch-accent" />
 </div>
 <div>
 <div className="text-2xl font-black text-stitch-ink">{kpis?.conversionRate || 0}%</div>
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider mt-1">Conv Rate</div>
 </div>
 </div>
 </div>

 {kpis?.topCampaign && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
 <div className="bg-stitch-surface p-3 rounded-xl border border-stitch-border">
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider">Top Campaign</div>
 <div className="text-sm font-bold text-stitch-ink mt-1">{kpis.topCampaign.title}</div>
 </div>
 {kpis.topCategory && (
 <div className="bg-stitch-surface p-3 rounded-xl border border-stitch-border">
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider">Top Category</div>
 <div className="text-sm font-bold text-stitch-ink mt-1">{kpis.topCategory}</div>
 </div>
 )}
 {kpis.topProduct && (
 <div className="bg-stitch-surface p-3 rounded-xl border border-stitch-border">
 <div className="text-[10px] text-stitch-muted uppercase tracking-wider">Top Product</div>
 <div className="text-sm font-bold text-stitch-ink mt-1">{kpis.topProduct}</div>
 </div>
 )}
 </div>
 )}

 {kpis?.bogo && (kpis.bogo.orders > 0 || kpis.bogo.freeItemsIssued > 0) && (
 <div className="bg-stitch-surface p-4 rounded-xl border border-stitch-accent/30">
 <div className="text-xs font-bold text-stitch-accent uppercase tracking-wider mb-3">BOGO Performance</div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
 <div><div className="text-xl font-black text-stitch-ink">{kpis.bogo.orders}</div><div className="text-[10px] text-stitch-muted uppercase">BOGO Orders</div></div>
 <div><div className="text-xl font-black text-stitch-ink">{kpis.bogo.freeItemsIssued}</div><div className="text-[10px] text-stitch-muted uppercase">Free Items Issued</div></div>
 <div><div className="text-xl font-black text-stitch-ink">Rs.{kpis.bogo.rewardValue}</div><div className="text-[10px] text-stitch-muted uppercase">Reward Value</div></div>
 <div><div className="text-sm font-black text-stitch-ink">{kpis.bogo.topCampaign?.title || 'N/A'}</div><div className="text-[10px] text-stitch-muted uppercase">Top BOGO Campaign</div></div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab === 'campaigns' && (
 <>
 <div className="w-full">
 <div className="flex justify-between items-end mb-6">
 <h3 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
 <Share2 size={20} className="text-stitch-accent" /> Active Campaigns
 </h3>
 <button
 type="button"
 onClick={() => setActiveTab('create')}
 className="text-sm font-bold bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink px-4 py-2 rounded-lg transition-colors accent-glow-hover"
 >
 + New Campaign
 </button>
 </div>
 <div className="max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {campaigns.length === 0 ? (
 <div className="bg-stitch-card border border-stitch-border rounded-2xl p-8 text-center text-stitch-muted">
 <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
 <p>No active campaigns found.</p>
 </div>
 ) : (
 campaigns.map((camp) => (
 <div key={camp.id} className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
 editingId === camp.id
 ? 'bg-stitch-card border-stitch-accent/70 ring-2 ring-stitch-accent/30'
 : camp.is_paused
 ? 'bg-stitch-card/50 border-stitch-border opacity-60'
 : 'bg-stitch-card border-stitch-border'
 }`}>
 {/* Top-right badge */}
 <div className={`absolute top-0 right-0 text-stitch-accent-ink text-[10px] font-black px-3 py-1 rounded-bl-lg ${camp.is_paused ? 'bg-stitch-muted' : 'bg-stitch-accent'}`}>
 {camp.is_paused ? 'PAUSED' : getCampaignBadgeLabel(camp)}
 </div>
 {editingId === camp.id && (
 <div className="absolute top-0 left-0 bg-stitch-accent text-stitch-accent-ink text-[10px] font-black px-3 py-1 rounded-br-lg">
 EDITING
 </div>
 )}
 <h4 className={`text-lg font-black mt-1 ${camp.is_paused ? 'text-stitch-muted' : 'text-stitch-ink'}`}>{camp.title}</h4>
 {camp.description && <p className="text-sm text-stitch-muted mt-1">{camp.description}</p>}

 {camp.image_url && (
 <div className="mt-3 w-full h-24 bg-stitch-surface rounded-lg overflow-hidden border border-stitch-border">
 <img src={`${BACKEND_URL}${camp.image_url}`} alt={camp.title} className="w-full h-full object-cover opacity-80" />
 </div>
 )}

 <div className="flex items-center justify-between mt-4 pt-4 border-t border-stitch-border">
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-stitch-muted">LIVE ON:</span>
 {camp.published_web && <span title="Website"><Globe size={14} className="text-stitch-accent" /></span>}
 {camp.published_pos && <span title="POS System"><Store size={14} className="text-[#fbbf24]" /></span>}
 {camp.published_tv && <span title="TV Board"><Megaphone size={14} className="text-stitch-accent" /></span>}
 {camp.published_facebook && <div className="text-[#3b82f6]" title="Facebook"><FacebookIcon size={14} /></div>}
 {camp.published_instagram && <div className="text-[#ec4899]" title="Instagram"><InstagramIcon size={14} /></div>}
 </div>
 <div className="flex gap-2">
 {/* Pause / Resume button with color feedback */}
 <button
 onClick={() => handleTogglePause(camp)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 camp.is_paused
 ? 'bg-stitch-success/20 text-stitch-success hover:bg-stitch-success/30 border border-stitch-success/30'
 : 'bg-stitch-accent/20 text-stitch-accent hover:bg-stitch-accent/30 border border-stitch-accent/30'
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
 ? 'bg-stitch-accent/30 text-stitch-accent border border-stitch-accent/30'
 : 'bg-stitch-surface hover:bg-stitch-accent/20 text-stitch-muted hover:text-stitch-accent'
 }`}
 title="Edit"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleShowHistory(camp)}
 className="p-2 bg-stitch-surface hover:bg-stitch-accent/20 text-stitch-muted hover:text-stitch-accent rounded-lg transition-colors"
 title="History & Versions"
 >
 <History size={16} />
 </button>
 <button
 onClick={() => handleClone(camp)}
 className="p-2 bg-stitch-surface hover:bg-stitch-accent/20 text-stitch-muted hover:text-stitch-accent rounded-lg transition-colors"
 title="Clone to this branch (paused)"
 >
 <Copy size={16} />
 </button>
 <button
 onClick={() => handleDelete(camp.id)}
 className="p-2 bg-stitch-surface hover:bg-stitch-danger/20 text-stitch-muted hover:text-stitch-danger rounded-lg transition-colors"
 title="Archive (soft delete)"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 
 {scheduledCampaigns.length > 0 && (
 <div className="mt-12">
 <h3 className="text-xl font-bold text-stitch-ink mb-6 flex items-center gap-2">
 <Percent size={20} className="text-stitch-accent" /> Upcoming Scheduled Deals
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
 {scheduledCampaigns.map((camp) => (
 <div key={camp.id} className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
 editingId === camp.id && isScheduled
 ? 'bg-stitch-card border-stitch-accent/70 ring-2 ring-stitch-accent/30'
 : !camp.is_active
 ? 'bg-stitch-card/50 border-stitch-border opacity-60'
 : 'bg-stitch-card border-stitch-border opacity-80'
 }`}>
 {/* Top-right badge */}
 <div className={`absolute top-0 right-0 text-stitch-accent-ink text-[10px] font-black px-3 py-1 rounded-bl-lg ${!camp.is_active ? 'bg-stitch-muted' : 'bg-stitch-accent'}`}>
 {!camp.is_active ? 'PAUSED' : getCampaignBadgeLabel(camp)}
 </div>
 {editingId === camp.id && isScheduled && (
 <div className="absolute top-0 left-0 bg-stitch-accent text-stitch-accent-ink text-[10px] font-black px-3 py-1 rounded-br-lg">
 EDITING
 </div>
 )}
 <h4 className={`text-lg font-black mt-1 ${!camp.is_active ? 'text-stitch-muted' : 'text-stitch-ink'}`}>{camp.title}</h4>
 <p className="text-sm text-stitch-muted mt-1">
 Scheduled to start at: <strong className="text-stitch-ink">{new Date(camp.start_date).toLocaleString()}</strong>
 </p>

 {camp.image_url && (
 <div className="mt-3 w-full h-24 bg-stitch-surface rounded-lg overflow-hidden border border-stitch-border">
 <img src={`${BACKEND_URL}${camp.image_url}`} alt={camp.title} className="w-full h-full object-cover opacity-80" />
 </div>
 )}

 <div className="flex items-center justify-between mt-4 pt-4 border-t border-stitch-border">
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-stitch-muted">WILL PUBLISH TO:</span>
 {camp.published_web && <span title="Website"><Globe size={14} className="text-stitch-accent" /></span>}
 {camp.published_pos && <span title="POS System"><Store size={14} className="text-[#fbbf24]" /></span>}
 {camp.published_tv && <span title="TV Board"><Megaphone size={14} className="text-stitch-accent" /></span>}
 {camp.published_facebook && <div className="text-[#3b82f6]" title="Facebook"><FacebookIcon size={14} /></div>}
 {camp.published_instagram && <div className="text-[#ec4899]" title="Instagram"><InstagramIcon size={14} /></div>}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => handleTogglePause(camp, true)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 !camp.is_active
 ? 'bg-stitch-success/20 text-stitch-success hover:bg-stitch-success/30 border border-stitch-success/30'
 : 'bg-stitch-accent/20 text-stitch-accent hover:bg-stitch-accent/30 border border-stitch-accent/30'
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
 ? 'bg-stitch-accent/30 text-stitch-accent border border-stitch-accent/30'
 : 'bg-stitch-surface hover:bg-stitch-accent/20 text-stitch-muted hover:text-stitch-accent'
 }`}
 title="Edit Schedule"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(camp.id, 'SCHEDULED')}
 className="p-2 bg-stitch-surface hover:bg-stitch-danger/20 text-stitch-muted hover:text-stitch-danger rounded-lg transition-colors"
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
 </>
 )}

 {/* Delete Confirmation Modal */}
 {deleteConfirmId && (
 <div className="fixed inset-0 bg-stitch-bg/80 flex items-center justify-center z-50">
 <div className="bg-stitch-panel border border-stitch-border rounded-2xl p-8 max-w-sm w-full shadow-2xl">
 <h3 className="text-xl font-black text-stitch-ink mb-2">Delete Campaign?</h3>
 <p className="text-stitch-muted text-sm mb-6">This action cannot be undone. The campaign will be removed from all platforms.</p>
 <div className="flex gap-4">
 <button
 onClick={() => setDeleteConfirmId(null)}
 className="flex-1 py-3 bg-stitch-surface hover:bg-stitch-card text-stitch-ink font-bold rounded-xl transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={confirmDelete}
 className="flex-1 py-3 bg-stitch-danger hover:opacity-90 text-stitch-ink font-bold rounded-xl transition-colors"
 >
 Delete
 </button>
 </div>
 </div>
 </div>
 )}
 {showPageModal && (
 <div className="fixed inset-0 bg-stitch-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-stitch-panel rounded-3xl w-full max-w-md overflow-hidden border border-stitch-border shadow-2xl">
 <div className="p-6 border-b border-stitch-border">
 <h2 className="text-xl font-black text-stitch-ink">Select {oauthPlatform === 'facebook' ? 'Facebook Page' : 'Instagram Account'}</h2>
 <p className="text-sm text-stitch-muted mt-1">Choose the account to link with this branch.</p>
 </div>
 <div className="p-6 space-y-3">
 {oauthPlatform === 'facebook' && fbPages.map(page => (
 <button key={page.id} onClick={() => handleSelectPage(page)} className="w-full text-left p-4 rounded-xl border border-stitch-border bg-stitch-surface/50 hover:bg-stitch-accent/10 hover:border-stitch-accent transition-colors">
 <div className="font-bold text-stitch-ink">{page.name}</div>
 <div className="text-xs text-stitch-muted mt-1">ID: {page.id}</div>
 </button>
 ))}
 {oauthPlatform === 'instagram' && igAccounts.map(account => (
 <button key={account.id} onClick={() => handleSelectPage(account)} className="w-full text-left p-4 rounded-xl border border-stitch-border bg-stitch-surface/50 hover:bg-stitch-accent/10 hover:border-stitch-accent transition-colors">
 <div className="font-bold text-stitch-ink">{account.username}</div>
 <div className="text-xs text-stitch-muted mt-1">ID: {account.id}</div>
 </button>
 ))}
 {((oauthPlatform === 'facebook' && fbPages.length === 0) || (oauthPlatform === 'instagram' && igAccounts.length === 0)) && (
 <p className="text-stitch-muted text-sm text-center py-4">No accounts found.</p>
 )}
 </div>
 <div className="p-6 border-t border-stitch-border bg-stitch-surface/50 flex justify-end">
 <button onClick={() => setShowPageModal(false)} className="px-6 py-2.5 rounded-full font-bold text-stitch-muted hover:text-stitch-ink transition-colors">Cancel</button>
 </div>
 </div>
 </div>
 )}

 {/* MARKETING-003 §10/§11 — Campaign History (audit log) + Versioning/Rollback */}
 {historyModal && (
 <div className="fixed inset-0 bg-stitch-bg/80 z-50 flex items-center justify-center p-4" onClick={() => setHistoryModal(null)}>
 <div className="bg-stitch-panel rounded-2xl border border-stitch-border max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
 <div className="p-6 border-b border-stitch-border flex items-center justify-between sticky top-0 bg-stitch-panel">
 <div>
 <h2 className="text-xl font-black text-stitch-ink">History — {historyModal.campaign.title}</h2>
 <p className="text-sm text-stitch-muted mt-1">Every lifecycle action, plus rollback to a prior version.</p>
 </div>
 <button onClick={() => setHistoryModal(null)} className="text-stitch-muted hover:text-stitch-ink"><X size={20} /></button>
 </div>
 <div className="p-6 space-y-6">
 <div>
 <h3 className="text-sm font-black text-stitch-muted uppercase tracking-wider mb-3">Audit Log</h3>
 <div className="space-y-2">
 {historyModal.logs.length === 0 && <p className="text-stitch-muted text-sm">No history yet.</p>}
 {historyModal.logs.map((log: any) => (
 <div key={log.id} className="flex items-center justify-between bg-stitch-surface/50 rounded-lg px-4 py-2 text-sm">
 <div>
 <span className="font-bold text-stitch-ink">{log.action}</span>
 {log.new_value && <span className="text-stitch-muted ml-2">{log.new_value}</span>}
 </div>
 <span className="text-xs text-stitch-muted">{new Date(log.createdAt).toLocaleString()}</span>
 </div>
 ))}
 </div>
 </div>
 <div>
 <h3 className="text-sm font-black text-stitch-muted uppercase tracking-wider mb-3">Versions</h3>
 <div className="space-y-2">
 {historyModal.versions.length === 0 && <p className="text-stitch-muted text-sm">No prior versions — this campaign hasn't been edited yet.</p>}
 {historyModal.versions.map((v: any) => (
 <div key={v.id} className="flex items-center justify-between bg-stitch-surface/50 rounded-lg px-4 py-2 text-sm">
 <span className="text-stitch-ink">Version {v.version} — {new Date(v.createdAt).toLocaleString()}</span>
 <button
 onClick={() => handleRollback(historyModal.campaign.id, v.version)}
 className="text-xs font-bold text-stitch-accent hover:text-stitch-accent-hover"
 >
 Rollback to this
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </>
 );
}

