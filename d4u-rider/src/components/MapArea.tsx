import React from 'react';
import { Coordinate, DeliveryStatus } from '../types';
import { SF_LANDMARKS, ROAD_CONNECTIONS } from '../data';
import { MapPin, Navigation, Zap, Shield, Store, Home } from 'lucide-react';

interface MapAreaProps {
  pickupCoords: { x: number; y: number } | null;
  dropoffCoords: { x: number; y: number } | null;
  driverCoords: { x: number; y: number } | null;
  activePath: { x: number; y: number }[];
  currentPathIndex: number;
  status: DeliveryStatus;
  activeRestaurantName?: string;
  activeCustomerName?: string;
}

export default function MapArea({
  pickupCoords,
  dropoffCoords,
  driverCoords,
  activePath,
  currentPathIndex,
  status,
  activeRestaurantName,
  activeCustomerName
}: MapAreaProps) {
  const width = 1000;
  const height = 600;

  const getCoords = (xPercent: number, yPercent: number) => {
    return {
      cx: (xPercent / 100) * width,
      cy: (yPercent / 100) * height,
    };
  };

  return (
    <div className="relative w-full h-[380px] md:h-[480px] bg-[#070e1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl group select-none">
      {/* City Map Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radar pulse radar map style decoration */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-r from-emerald-500/10 to-transparent animate-pulse pointer-events-none" style={{ left: '42%' }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        id="delivery-map-canvas"
      >
        <defs>
          <radialGradient id="surgeHeatmap" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="riderAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4edea3" stopOpacity="0.9" />
          </linearGradient>

          <filter id="glowPath" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- ROAD NETWORK CONNECTIONS --- */}
        <g id="road-lines-bg" className="stroke-[#131d31] stroke-[5] stroke-linecap-round stroke-linejoin-round opacity-80">
          {ROAD_CONNECTIONS.map((seg, i) => {
            const fNode = SF_LANDMARKS.find(l => l.id === seg.from);
            const tNode = SF_LANDMARKS.find(l => l.id === seg.to);
            if (!fNode || !tNode) return null;
            const pt1 = getCoords(fNode.x, fNode.y);
            const pt2 = getCoords(tNode.x, fNode.y); // simulate city street grids with L-bends
            return (
              <g key={`road-bg-${i}`}>
                <line x1={pt1.cx} y1={pt1.cy} x2={pt2.cx} y2={pt1.cy} />
                <line x1={pt2.cx} y1={pt1.cy} x2={pt2.cx} y2={pt2.cy} />
              </g>
            );
          })}
        </g>
        
        <g id="road-lanes-fg" className="stroke-[#222e47] stroke-[1.5] stroke-linecap-round stroke-linejoin-round opacity-60">
          {ROAD_CONNECTIONS.map((seg, i) => {
            const fNode = SF_LANDMARKS.find(l => l.id === seg.from);
            const tNode = SF_LANDMARKS.find(l => l.id === seg.to);
            if (!fNode || !tNode) return null;
            const pt1 = getCoords(fNode.x, fNode.y);
            const pt2 = getCoords(tNode.x, fNode.y);
            return (
              <g key={`road-fg-${i}`}>
                <line x1={pt1.cx} y1={pt1.cy} x2={pt2.cx} y2={pt1.cy} />
                <line x1={pt2.cx} y1={pt1.cy} x2={pt2.cx} y2={pt2.cy} />
              </g>
            );
          })}
        </g>

        {/* --- HOT ZONE HEATMAP GLOW --- */}
        <g id="hotzone-circle" className="pointer-events-none">
          {SF_LANDMARKS.filter(l => l.isSurgeZone).map(h => {
            const pt = getCoords(h.x, h.y);
            return (
              <g key={`hot-${h.id}`}>
                <circle cx={pt.cx} cy={pt.cy} r="160" fill="url(#surgeHeatmap)" />
                <circle cx={pt.cx} cy={pt.cy} r="80" fill="url(#surgeHeatmap)" />
                <circle cx={pt.cx} cy={pt.cy} r="40" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="5, 5" className="opacity-40" />
              </g>
            );
          })}
        </g>

        {/* --- THE ACTIVE GPS ROUTE PATH --- */}
        {activePath.length > 0 && (
          <g id="animated-trip-route" className="pointer-events-none">
            <path
              d={`M ${activePath.map(p => {
                const pt = getCoords(p.x, p.y);
                return `${pt.cx} ${pt.cy}`;
              }).join(' L ')}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowPath)"
              className="opacity-40 animate-pulse"
            />
            
            <path
              d={`M ${activePath.map(p => {
                const pt = getCoords(p.x, p.y);
                return `${pt.cx} ${pt.cy}`;
              }).join(' L ')}`}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Glowing moving light dot indicating food en route */}
            <path
              d={`M ${activePath.map(p => {
                const pt = getCoords(p.x, p.y);
                return `${pt.cx} ${pt.cy}`;
              }).join(' L ')}`}
              fill="none"
              stroke="#4edea3"
              strokeWidth="3.5"
              strokeDasharray="15, 120"
              style={{ animation: 'dash 3s linear infinite' }}
            />
          </g>
        )}

        {/* --- RESTAURANT & CUSTOMER NODES --- */}
        <g id="delivery-stations">
          {SF_LANDMARKS.map((loc) => {
            const pt = getCoords(loc.x, loc.y);
            const isRestaurant = loc.id.includes('burger') || loc.id.includes('pizza') || loc.id.includes('wok') || loc.id.includes('fries');
            
            // Is this specific node involved in the active order
            const isActivePickup = pickupCoords && Math.abs(pickupCoords.x - loc.x) < 1 && Math.abs(pickupCoords.y - loc.y) < 1;
            const isActiveDropoff = dropoffCoords && Math.abs(dropoffCoords.x - loc.x) < 1 && Math.abs(dropoffCoords.y - loc.y) < 1;

            return (
              <g 
                key={loc.id} 
                transform={`translate(${pt.cx}, ${pt.cy})`}
                className="select-none"
              >
                {/* Ping rings for active targets */}
                {(isActivePickup || isActiveDropoff) && (
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill="none"
                    stroke={isActivePickup ? "#fbbf24" : "#4edea3"}
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                )}

                {/* Base Anchor Card Holder */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r="15" 
                  fill="#0c1322" 
                  stroke={
                    isActivePickup 
                      ? '#fbbf24' 
                      : isActiveDropoff 
                      ? '#4edea3' 
                      : isRestaurant 
                      ? '#ffdf9f' 
                      : '#94a3b8'
                  }
                  strokeWidth={isActivePickup || isActiveDropoff ? '3' : '1.5'}
                  className="shadow-md"
                />

                {/* Micro Emoji Badge inside anchor */}
                <text x="0" y="3.5" fontSize="11" textAnchor="middle" className="select-none">
                  {loc.id === 'burger_barn' ? '🍔' : 
                   loc.id === 'pizzeria_manifesto' ? '🍕' :
                   loc.id === 'wok_heaven' ? '🍜' :
                   loc.id === 'flanders_fries' ? '🍟' : '🏠'}
                </text>

                {/* Store Name label with clean dark-card styled panel */}
                <foreignObject x="-70" y="18" width="140" height="40" className="overflow-visible pointer-events-none">
                  <div className="flex flex-col items-center">
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold tracking-tight whitespace-nowrap shadow-md border 
                        ${isActivePickup 
                          ? 'bg-[#fbbf24] text-[#402d00] border-[#ffe1a7]' 
                          : isActiveDropoff 
                          ? 'bg-[#4edea3] text-[#003824] border-[#6ffbbe]' 
                          : 'bg-[#141b2b]/95 text-slate-300 border-slate-800'
                        }
                      `}
                    >
                      {loc.name.split(' - ')[0].split(' Headquarters')[0]}
                    </span>
                    <span className="text-[7.5px] text-slate-500 font-mono italic">
                      {isRestaurant ? 'Store POS Connected' : 'End Customer'}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>

        {/* --- DRIVER / RIDER SIMULATED POSITION TRUCKING --- */}
        {driverCoords && (
          <g>
            <circle 
              cx={getCoords(driverCoords.x, driverCoords.y).cx} 
              cy={getCoords(driverCoords.x, driverCoords.y).cy} 
              r="28" 
              fill="url(#riderAura)" 
              className="animate-pulse"
            />
            
            <g transform={`translate(${getCoords(driverCoords.x, driverCoords.y).cx}, ${getCoords(driverCoords.x, driverCoords.y).cy})`}>
              <circle
                cx="0"
                cy="0"
                r="11"
                fill="#fbbf24"
                stroke="#070e1d"
                strokeWidth="2.5"
                className="shadow-2xl"
              />
              {/* Rider Icon Delivery Scooter direction flag */}
              <text x="0" y="4" fontSize="11" textAnchor="middle" className="select-none">🛵</text>
              
              {/* Mini Status flag bubble above rider */}
              <foreignObject x="-40" y="-30" width="80" height="18" className="overflow-visible">
                <div className="flex justify-center">
                  <span className="bg-[#fbbf24] text-[#402d00] text-[7.5px] font-mono font-extrabold px-1 py-0.2 rounded-full uppercase tracking-wider border border-[#ffe1a7] shadow">
                    {status === 'ACCEPTED' ? 'To Restaurant' : 'To Customer'}
                  </span>
                </div>
              </foreignObject>
            </g>
          </g>
        )}
      </svg>

      {/* Top Margin Indicator overlay to prevent tech larp / keep human labels */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-[#0c1322]/95 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[10.5px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-ping" />
          <span className="text-slate-300 font-bold uppercase tracking-wider font-mono text-[9px]">SF Delivery Map Live</span>
        </div>
      </div>

      {/* Floating map status details */}
      <div className="absolute bottom-3.5 right-3.5 flex gap-2">
        <div className="bg-[#0c1322]/90 border border-slate-800 px-2.5 py-1 rounded text-[10px] text-amber-500 font-bold flex items-center gap-1">
          🔥 Financial District high-demand multiplier active (1.5x)
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -120;
          }
        }
      `}</style>
    </div>
  );
}
