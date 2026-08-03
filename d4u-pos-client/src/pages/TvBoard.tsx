import React, { useState, useEffect } from 'react';
import { Megaphone, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config/backend';
import { apiFetch } from '../pos/api';

export default function TvBoard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  let user: any = null;
  try {
    user = JSON.parse(localStorage.getItem('d4u_main_user') || 'null');
  } catch (e) {
    console.error('[TvBoard] Corrupt d4u_main_user in localStorage, ignoring:', e);
  }
  const storeName = user?.store_name || user?.store?.name || 'HQ';
  const storeId = user?.store_id;

  // MARKETING-003 §5 — rotation priority: Scheduled/Current (both already
  // priority-sorted by CampaignResolverService) → Upcoming. No video/image/
  // brand-slide CMS asset model exists yet in this codebase (see gap notes),
  // so those tiers are a documented gap rather than built here.
  const slides = [...campaigns, ...upcoming];

  const activeKots = useLiveQuery(
    () => db.kots.where('status').anyOf(['PREPARING', 'READY']).toArray()
  ) || [];

  const preparingOrders = activeKots
    .filter(k => k.status === 'PREPARING')
    .sort((a, b) => b.id - a.id);

  const readyOrders = activeKots
    .filter(k => {
      if (k.status !== 'READY') return false;
      if (!k.readyAt) return true; 
      const readyTime = new Date(k.readyAt).getTime();
      return (currentTime - readyTime) < 5 * 60 * 1000; // 5 minutes
    })
    .sort((a, b) => b.id - a.id);

  const fetchCampaigns = () => {
    // MARKETING-003 §1/§2: store-scoped, routed through the shared
    // CampaignResolverService (channel=tv) — replaces the previous global,
    // client-side-filtered fetch. apiFetch reads the real d4u_pos_token key
    // internally — the previous user?.token read was always empty, since
    // the token has never been stored on the d4u_main_user object.
    if (storeId) {
      apiFetch(`/marketing/campaign?store_id=${storeId}&channel=tv`, { auth: true })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCampaigns(data);
          else { console.error('Invalid campaigns data:', data); setCampaigns([]); }
        })
        .catch(console.error);
    } else {
      apiFetch(`/marketing/campaign`, { auth: true })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCampaigns(data.filter((c: any) => c.published_tv || c.published_pos));
          else { console.error('Invalid campaigns data:', data); setCampaigns([]); }
        })
        .catch(console.error);
    }

    // "Upcoming" tier — SCHEDULED campaigns bound for this store's TV, shown
    // after the live rotation so staff/customers can see what's coming next.
    const listUrl = storeId ? `/marketing/campaign?store_id=${storeId}` : `/marketing/campaign`;
    apiFetch(listUrl, { auth: true })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUpcoming(data.filter((c: any) => c.status === 'SCHEDULED' && c.published_tv));
        else { console.error('Invalid upcoming data:', data); setUpcoming([]); }
      })
      .catch(console.error);
  };

  // Fetches the current PREPARING/READY KOTs from the real backend and
  // mirrors StitchKDS.tsx's syncKOTs() so TV Board is a real data source in
  // its own right rather than a passive reader of whatever the Kitchen
  // Display screen happened to already sync into the shared Dexie table.
  const syncKots = async () => {
    try {
      const sid = storeId || 1;
      const res = await apiFetch(`/kots?store_id=${sid}&includeReady=true`, { auth: true });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          await db.kots.clear();
          const mapped = data.map((k: any) => ({
            id: k.id,
            // Prefer customer-facing OnlineOrder.id for online orders so the TV Board
            // displays the same order number (#1119) as the Website Tracker and POS cards,
            // while falling back to k.order_id for POS-native orders (#719).
            orderId: k.order?.onlineOrder?.id || k.order?.onlineOrder?.orderId || k.order_id,
            // Order.orderType doesn't exist -- the real field is
            // order_source ("WALKIN"/"ONLINE"/etc). Reading the wrong field
            // meant this was always undefined, so the `|| 'Walk-in'`
            // fallback fired for every KOT regardless of true source.
            type: k.order?.order_source === 'ONLINE'
              ? (k.order?.onlineOrder?.type === 'PICKUP' ? 'Pickup' : 'Online')
              : 'Walk-in',
            customer: k.order?.customer?.name || '',
            customerPhone: k.order?.customer?.phone || '',
            items: k.items ? JSON.stringify(k.items) : '[]',
            notes: k.notes,
            timePlaced: new Date(k.createdAt).toLocaleTimeString(),
            prepTimeMinutes: k.prep_time_minutes || 10,
            status: k.status,
            startTime: k.start_time ? new Date(k.start_time).toISOString() : '',
            totalAmount: k.order?.total_amount || 0,
            paymentMethod: k.order?.payment_method || 'CASH',
            printCount: 0,
          }));
          await db.kots.bulkAdd(mapped);
        }
      }
    } catch (e) {
      console.error('[TvBoard] Failed to sync KOTs from backend:', e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    syncKots();

    // Socket Setup
    const socket = io(BACKEND_URL);
    socket.on('connect', () => {
      try {
        const u = JSON.parse(localStorage.getItem('d4u_main_user') || 'null');
        if (u && u.store_id) {
          socket.emit('join_store', { store_id: u.store_id });
        }
      } catch (e) {}
    });

    socket.on('marketing_update', () => {
      console.log('Marketing Update Received!');
      fetchCampaigns();
    });

    // AppGateway.broadcast() is a strict room-scoped emit — without the
    // join_store above this would never arrive. Mirrors the identical fix
    // already shipped for StitchKDS.tsx this session.
    socket.on('kds_update', () => {
      syncKots();
    });

    // Refresh every 10 seconds to clean up stale READY orders
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
      clearInterval(timer);
      socket.off('kds_update');
      socket.disconnect();
    };
  }, []);

  // Auto-rotate Marketing Campaigns (Scheduled/Current, then Upcoming)
  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  // Telemetry View Tracking (live campaigns only — no view event for upcoming previews)
  useEffect(() => {
    if (currentSlide < campaigns.length && campaigns[currentSlide]) {
      const campId = campaigns[currentSlide].id;
      const lastViewKey = `camp_view_${campId}`;
      const lastView = localStorage.getItem(lastViewKey);
      const now = Date.now();

      // 5-minute throttle (300,000 ms)
      if (!lastView || now - parseInt(lastView) > 300000) {
        localStorage.setItem(lastViewKey, now.toString());
        fetch(`${BACKEND_URL}/marketing/analytics/${campId}/view`, {
          method: 'POST',
        }).catch(console.error);
      }
    }
  }, [currentSlide, campaigns]);

  // Order fetching is now handled reactively by Dexie's useLiveQuery

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex overflow-hidden">
      {/* Left side: Digital Signage / Marketing Carousel */}
      <div className="w-1/2 h-full bg-slate-800 relative flex flex-col justify-center items-center overflow-hidden border-r border-slate-700">
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10 bg-slate-900/50 p-4 rounded-2xl backdrop-blur-md">
          <Megaphone className="text-[#ec4899] w-8 h-8" />
          <span className="text-xl font-bold text-white tracking-widest uppercase">Special Offers</span>
        </div>

        {slides.length > 0 && slides[currentSlide] ? (() => {
          const slide = slides[currentSlide];
          const isUpcoming = currentSlide >= campaigns.length;
          const msLeft = slide.end_date ? new Date(slide.end_date).getTime() - Date.now() : null;
          const isLimitedOffer = !isUpcoming && msLeft !== null && msLeft > 0 && msLeft < 24 * 60 * 60 * 1000;
          const hoursLeft = msLeft ? Math.max(0, Math.floor(msLeft / (60 * 60 * 1000))) : 0;
          const minsLeft = msLeft ? Math.max(0, Math.floor((msLeft % (60 * 60 * 1000)) / 60000)) : 0;
          const badgeText =
            slide.campaign_type === 'BOGO'
              ? `BOGO — BUY ${slide.buy_qty} GET ${slide.reward_qty} ${slide.reward_type === 'PERCENTAGE' ? `${slide.discount_pct}% OFF` : 'FREE'}`
              : slide.campaign_type === 'FLAT'
                ? `SALE — Rs.${slide.flat_discount_amount} OFF`
                : slide.campaign_type === 'BUNDLE'
                  ? `BUNDLE — FIXED PRICE Rs.${slide.bundle_price}`
                  : slide.campaign_type === 'COMBO'
                    ? `COMBO — FIXED PRICE Rs.${slide.bundle_price}`
                    : slide.campaign_type === 'FREE_GIFT'
                      ? `FREE ITEM — SPEND Rs.${slide.min_spend}+`
                      : `SALE — ${slide.discount_pct}% OFF`;
          return (
          <div className="w-full h-full flex flex-col justify-center items-center text-center p-12 transition-all duration-1000 animate-fade-in relative z-0">
            {isUpcoming && (
              <div className="absolute top-8 right-8 z-20 bg-blue-600 text-white text-xl font-black px-4 py-2 rounded-xl shadow-2xl uppercase tracking-wider">
                Upcoming{slide.scheduled_at ? ` — ${new Date(slide.scheduled_at).toLocaleDateString()}` : ''}
              </div>
            )}
            {isLimitedOffer && (
              <div className="absolute top-8 right-8 z-20 bg-red-600 text-white text-xl font-black px-4 py-2 rounded-xl shadow-2xl uppercase tracking-wider animate-pulse">
                Limited Offer
              </div>
            )}
            {slide.image_url && (
              <>
                <img
                  src={`${BACKEND_URL}${slide.image_url}`}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
                {/* Scrim so the title/badge/description below stay legible
                    over a photo instead of being hidden entirely -- a
                    banner image used to replace the whole text block
                    (heading, subheading, discount badge all disappeared)
                    instead of sitting behind it. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-[1]" />
              </>
            )}
            <div className="bg-[#ec4899] text-white text-3xl font-black px-6 py-2 rounded-xl mb-8 transform -rotate-3 shadow-2xl relative z-10">
              {badgeText}
            </div>
            <h1 className="text-6xl font-black text-white mb-6 leading-tight relative z-10 drop-shadow-2xl">
              {slide.title}
            </h1>
            <p className="text-2xl text-slate-200 max-w-lg relative z-10 drop-shadow-lg font-medium mb-8">
              {slide.description}
            </p>
            {slide.show_countdown && !isUpcoming && msLeft !== null && msLeft > 0 && (
              <p className="text-red-400 text-2xl font-black mb-6 relative z-10">Ends in {hoursLeft}h {minsLeft}m</p>
            )}
            {slide.campaign_type === 'FREE_GIFT' && slide.giftProduct?.name && (
              <p className="text-amber-400 text-xl font-bold mb-6 relative z-10">🎁 Free Gift: {slide.giftProduct.name}</p>
            )}
            {['BUNDLE', 'COMBO'].includes(slide.campaign_type) && slide.bundle_products?.length > 0 && (
              <p className="text-amber-400 text-xl font-bold mb-6 relative z-10">Includes: {slide.bundle_products.map((p: any) => p.name).join(' + ')}</p>
            )}
            {slide.target_products?.length > 0 && (
              <div className="grid grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
                {slide.target_products.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 flex items-center gap-4 border border-slate-700 shadow-xl">
                    {p.image_url ? (
                      <img src={p.image_url.startsWith('http') ? p.image_url : `${BACKEND_URL}${p.image_url}`} className="w-20 h-20 rounded-xl object-cover border-2 border-slate-700" alt={p.name} />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500 font-black text-2xl">?</div>
                    )}
                    <div className="text-left">
                      <h4 className="font-bold text-xl text-white line-clamp-1">{p.name}</h4>
                      <div className="text-amber-400 font-black text-lg mt-1">Rs {p.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })() : (
          <div className="text-slate-500 text-center animate-pulse">
            <Megaphone size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-3xl font-bold">Welcome to D4U POS</h2>
          </div>
        )}

        {/* Carousel Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-12 flex gap-3 z-10">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-12 bg-[#ec4899]' : 'w-4 bg-slate-600'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right side: Order Queue */}
      <div className="w-1/2 h-full flex flex-col bg-slate-900">
        <div className="h-20 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
          <h2 className="text-2xl font-black tracking-widest text-white uppercase">Order Status</h2>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Preparing Column */}
          <div className="w-1/2 h-full border-r border-slate-700 p-8 flex flex-col">
            <h3 className="text-3xl font-black text-amber-400 mb-8 uppercase tracking-widest border-b border-amber-400/20 pb-4">Preparing</h3>
            <div className="grid grid-cols-2 gap-6 overflow-y-auto content-start">
              {preparingOrders.map(order => (
                <div key={order.id} className="bg-slate-800 rounded-2xl p-3 text-center shadow-lg border border-slate-700 animate-fade-in flex flex-col items-center justify-center h-24">
                  <span className="text-amber-400 font-bold text-sm mb-1">{order.type}</span>
                  <span className="text-3xl font-black text-white">#{order.orderId}</span>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div className="col-span-2 text-slate-500 text-center py-10 italic">No orders preparing</div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="w-1/2 h-full p-8 flex flex-col bg-[#10b981]/5">
            <h3 className="text-3xl font-black text-[#10b981] mb-8 uppercase tracking-widest border-b border-[#10b981]/20 pb-4 flex items-center gap-3">
              Ready <CheckCircle2 className="w-8 h-8" />
            </h3>
            <div className="grid grid-cols-2 gap-[20px] overflow-y-auto content-start py-2">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-[#10b981] rounded-2xl mx-[20px] text-center shadow-lg shadow-[#10b981]/20 ready-blink-outline flex flex-col items-center justify-center h-[86px]">
                  <span className="text-white/80 font-bold text-sm mb-1">{order.type}</span>
                  <span className="text-3xl font-black text-white">#{order.orderId}</span>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div className="col-span-2 text-[#10b981]/50 text-center py-10 italic">No orders ready</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
