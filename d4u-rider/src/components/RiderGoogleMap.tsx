import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Store, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, Radio, Compass } from 'lucide-react';

interface RiderGoogleMapProps {
  realGps: { lat: number; lng: number; accuracy?: number | null; timestamp?: number } | null;
  gpsStatus: 'idle' | 'acquiring' | 'active' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';
  gpsError?: string | null;
  onRetryGps?: () => void;
  storeName?: string;
  activeOrder?: any;
  status?: string;
}

// Sleek dark-mode map style matching the Rider App theme
const DARK_MAP_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1324" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1324" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#f8fafc" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#111f38" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060b14" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#060b14" }] }
];

// Singleton loader to avoid duplicate script injection
let riderGoogleMapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve();
  }
  if (riderGoogleMapsPromise) return riderGoogleMapsPromise;

  riderGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('d4u-rider-google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'd4u-rider-google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      riderGoogleMapsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });
  return riderGoogleMapsPromise;
}

export const RiderGoogleMap: React.FC<RiderGoogleMapProps> = ({
  realGps,
  gpsStatus,
  gpsError,
  onRetryGps,
  storeName = 'Restaurant',
  activeOrder,
  status,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  const [mapApiStatus, setMapApiStatus] = useState<'loading' | 'ready' | 'missing_key' | 'error'>('loading');

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setMapApiStatus('missing_key');
      return;
    }

    let isMounted = true;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) {
          setMapApiStatus('error');
          return;
        }

        const initialLat = realGps?.lat ?? 31.4704;
        const initialLng = realGps?.lng ?? 74.4102;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 15,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;

        // Rider Marker (Pulsing navigation arrow)
        const riderSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="#10b981" stroke="#ffffff" stroke-width="2">
            <circle cx="12" cy="12" r="10" fill="#10b981" fill-opacity="0.95" />
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="#ffffff" />
          </svg>
        `;

        const marker = new google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map,
          title: 'Your Live Position',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(riderSvg)}`,
            scaledSize: new google.maps.Size(38, 38),
            anchor: new google.maps.Point(19, 19),
          },
          zIndex: 100,
        });

        riderMarkerRef.current = marker;

        // Accuracy Circle
        if (realGps?.accuracy) {
          const circle = new google.maps.Circle({
            map,
            center: { lat: initialLat, lng: initialLng },
            radius: realGps.accuracy,
            fillColor: '#10b981',
            fillOpacity: 0.15,
            strokeColor: '#10b981',
            strokeOpacity: 0.4,
            strokeWeight: 1,
          });
          accuracyCircleRef.current = circle;
        }

        setMapApiStatus('ready');
      })
      .catch(() => {
        if (!isMounted) return;
        setMapApiStatus('error');
      });

    return () => {
      isMounted = false;
      if (riderMarkerRef.current) riderMarkerRef.current.setMap(null);
      if (accuracyCircleRef.current) accuracyCircleRef.current.setMap(null);
    };
  }, []);

  // Update marker position live when realGps updates
  useEffect(() => {
    if (mapApiStatus !== 'ready' || !realGps || !mapInstanceRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const pos = { lat: realGps.lat, lng: realGps.lng };

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setPosition(pos);
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setCenter(pos);
      if (realGps.accuracy) accuracyCircleRef.current.setRadius(realGps.accuracy);
    } else if (realGps.accuracy) {
      accuracyCircleRef.current = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: pos,
        radius: realGps.accuracy,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        strokeColor: '#10b981',
        strokeOpacity: 0.4,
        strokeWeight: 1,
      });
    }

    // Smoothly pan map to follow rider
    mapInstanceRef.current.panTo(pos);
  }, [realGps, mapApiStatus]);

  const handleCenterOnMe = () => {
    if (!mapInstanceRef.current || !realGps) return;
    mapInstanceRef.current.panTo({ lat: realGps.lat, lng: realGps.lng });
    mapInstanceRef.current.setZoom(16);
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  return (
    <div className="absolute inset-0 bg-[#070e1d] z-0 overflow-hidden flex flex-col">
      {/* 1. Missing Key or Error Fallback — Sleek Realtime Radar HUD */}
      {(mapApiStatus === 'missing_key' || mapApiStatus === 'error') && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-10 select-none">
          {/* Subtle Grid Radar Background */}
          <div 
            className="absolute inset-0 opacity-[0.07] pointer-events-none" 
            style={{
              backgroundImage: `
                linear-gradient(to right, #38bdf8 1px, transparent 1px),
                linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px'
            }}
          />

          {/* Radar Sweep Animation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full border border-sky-500/20 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-sky-500/30 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-emerald-500/30 animate-ping opacity-25" />
              </div>
            </div>
          </div>

          {/* Top Notice */}
          <div className="w-full max-w-sm mt-12 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">Device GPS Feed</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Radar Mode
              </span>
            </div>

            {/* GPS Telemetry Pill */}
            {realGps ? (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>LAT: <strong className="text-emerald-400">{realGps.lat.toFixed(5)}</strong></span>
                  <span>LNG: <strong className="text-emerald-400">{realGps.lng.toFixed(5)}</strong></span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>ACCURACY: <strong className="text-sky-400">±{realGps.accuracy ? Math.round(realGps.accuracy) : 0}m</strong></span>
                  <span>{new Date(realGps.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center py-2">
                {gpsStatus === 'acquiring' && '🛰️ Acquiring satellite GPS fix...'}
                {gpsStatus === 'denied' && '⚠️ Location permission denied by device.'}
                {gpsStatus === 'unavailable' && '📡 GPS signal temporarily unavailable.'}
                {gpsStatus === 'timeout' && '⏱️ GPS request timed out.'}
                {gpsStatus === 'idle' && 'GPS standby mode.'}
              </div>
            )}

            {/* Notice about API Key */}
            <div className="text-[10px] text-slate-400 leading-tight">
              Google Maps API key not set (<code className="text-slate-300">VITE_GOOGLE_MAPS_API_KEY</code>). Showing real-time device GPS telemetry. Socket streaming is active.
            </div>
          </div>

          {/* Central Pulsing Rider Beacon */}
          <div className="flex flex-col items-center justify-center gap-2 z-20">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-ping absolute" />
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <Navigation size={22} className="text-white transform -rotate-45" />
              </div>
            </div>
            <span className="text-xs font-bold text-white tracking-wide">
              {realGps ? 'GPS Connected' : 'Waiting for GPS'}
            </span>
          </div>

          {/* Bottom GPS Action Pill */}
          <div className="w-full max-w-sm mb-6 flex justify-center z-20">
            {gpsError && (
              <div className="bg-red-950/80 border border-red-500/40 rounded-xl p-3 text-red-200 text-xs flex items-center justify-between gap-3 shadow-xl">
                <span>{gpsError}</span>
                {onRetryGps && (
                  <button 
                    onClick={onRetryGps}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Google Map Canvas (When Key is present and loaded) */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full flex-1 z-0"
        style={{ display: mapApiStatus === 'ready' ? 'block' : 'none' }}
      />

      {/* 3. Floating Overlay Badges & Controls on top of Google Map */}
      {mapApiStatus === 'ready' && (
        <>
          {/* Top Status Badge */}
          <div className="absolute top-16 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-xl pointer-events-auto">
              <span className={`w-2 h-2 rounded-full ${realGps ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-white text-xs font-medium font-mono">
                {realGps ? `GPS: ±${realGps.accuracy ? Math.round(realGps.accuracy) : 0}m` : 'Acquiring GPS...'}
              </span>
            </div>

            {realGps && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 text-[11px] text-slate-300 font-mono shadow-xl pointer-events-auto">
                {realGps.lat.toFixed(4)}, {realGps.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Floating Map Controls */}
          <div className="absolute bottom-28 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleCenterOnMe}
              title="Center on My Location"
              className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700/60 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95"
            >
              <Compass size={20} />
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95"
            >
              <ZoomOut size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RiderGoogleMap;
