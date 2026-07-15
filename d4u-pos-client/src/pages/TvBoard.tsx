import React, { useState, useEffect } from 'react';
import { Megaphone, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function TvBoard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeKots = useLiveQuery(
    () => db.kots.where('status').anyOf(['PREPARING', 'READY']).toArray()
  ) || [];

  const preparingOrders = activeKots.filter(k => k.status === 'PREPARING');
  const readyOrders = activeKots.filter(k => k.status === 'READY');

  useEffect(() => {
    // Fetch Campaigns
    fetch(`${BACKEND_URL}/marketing/campaign`)
      .then(res => res.json())
      .then(data => {
        // Filter campaigns published to POS
        setCampaigns(data.filter((c: any) => c.published_pos));
      })
      .catch(console.error);
  }, []);

  // Auto-rotate Marketing Campaigns
  useEffect(() => {
    if (campaigns.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % campaigns.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [campaigns]);

  // Order fetching is now handled reactively by Dexie's useLiveQuery

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex overflow-hidden">
      {/* Left side: Digital Signage / Marketing Carousel */}
      <div className="w-1/2 h-full bg-slate-800 relative flex flex-col justify-center items-center overflow-hidden border-r border-slate-700">
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10 bg-slate-900/50 p-4 rounded-2xl backdrop-blur-md">
          <Megaphone className="text-[#ec4899] w-8 h-8" />
          <span className="text-xl font-bold text-white tracking-widest uppercase">Special Offers</span>
        </div>

        {campaigns.length > 0 ? (
          <div className="w-full h-full flex flex-col justify-center items-center text-center p-12 transition-all duration-1000 animate-fade-in relative z-0">
            {campaigns[currentSlide].image_url ? (
              <img 
                src={`${BACKEND_URL}${campaigns[currentSlide].image_url}`} 
                alt={campaigns[currentSlide].title}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            ) : (
              <>
                <div className="bg-[#ec4899] text-white text-3xl font-black px-6 py-2 rounded-xl mb-8 transform -rotate-3 shadow-2xl relative z-10">
                  {campaigns[currentSlide].discount_pct}% OFF
                </div>
                <h1 className="text-6xl font-black text-white mb-6 leading-tight relative z-10 drop-shadow-2xl">
                  {campaigns[currentSlide].title}
                </h1>
                <p className="text-2xl text-slate-200 max-w-lg relative z-10 drop-shadow-lg font-medium mb-8">
                  {campaigns[currentSlide].description}
                </p>
                {campaigns[currentSlide].target_products?.length > 0 && (
                  <div className="grid grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
                    {campaigns[currentSlide].target_products.slice(0, 4).map((p: any) => (
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
              </>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-center animate-pulse">
            <Megaphone size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-3xl font-bold">Welcome to D4U POS</h2>
          </div>
        )}

        {/* Carousel Indicators */}
        {campaigns.length > 1 && (
          <div className="absolute bottom-12 flex gap-3 z-10">
            {campaigns.map((_, idx) => (
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
          <div className="text-slate-400 font-medium">Store: HQ</div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Preparing Column */}
          <div className="w-1/2 h-full border-r border-slate-700 p-8 flex flex-col">
            <h3 className="text-3xl font-black text-amber-400 mb-8 uppercase tracking-widest border-b border-amber-400/20 pb-4">Preparing</h3>
            <div className="grid grid-cols-2 gap-6 overflow-y-auto content-start">
              {preparingOrders.map(order => (
                <div key={order.id} className="bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-slate-700 animate-fade-in flex flex-col items-center justify-center h-32">
                  <span className="text-amber-400 font-bold text-lg mb-1">{order.type}</span>
                  <span className="text-5xl font-black text-white">#{order.orderId}</span>
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
            <div className="grid grid-cols-2 gap-6 overflow-y-auto content-start">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-[#10b981] rounded-2xl p-6 text-center shadow-lg shadow-[#10b981]/20 animate-fade-in flex flex-col items-center justify-center h-32 transform hover:scale-105 transition-transform">
                  <span className="text-white/80 font-bold text-lg mb-1">{order.type}</span>
                  <span className="text-5xl font-black text-white">#{order.orderId}</span>
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
