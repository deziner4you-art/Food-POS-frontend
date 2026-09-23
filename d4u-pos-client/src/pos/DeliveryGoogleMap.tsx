import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Store, Navigation, MapPin, Radio, Shield, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface RiderLocationData {
  riderId: number;
  storeId?: number;
  lat: number;
  lng: number;
  accuracy?: number | null;
  timestamp?: number;
  name?: string;
  phone?: string;
  status?: string; // 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  currentOrderId?: number | string | null;
}

interface DeliveryGoogleMapProps {
  activeDeliveries: any[];
  selectedDeliveryId: number | null;
  onSelectDelivery?: (id: number) => void;
  storeId?: number;
  storeName?: string;
  socket?: any;
}

// Known branch coordinates (fallback defaults for Lahore branches)
export const STORE_COORDINATES: Record<number, { lat: number; lng: number; name: string }> = {
  1: { lat: 31.4704, lng: 74.4102, name: 'DHA Branch' },
  2: { lat: 31.5135, lng: 74.3486, name: 'Gulberg Branch' },
  3: { lat: 31.4697, lng: 74.2728, name: 'Johar Town Branch' },
};

// Sleek dark-mode map style matching D4U POS UI
const DARK_MAP_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#0d1527" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1527" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#132338" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f8fafc" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060b14" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#060b14" }] }
];

// Singleton script loader to avoid duplicate script injection
let googleMapsLoadingPromise: Promise<void> | null = null;
function loadGoogleMapsApi(apiKey: string): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve();
  }
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('d4u-google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'd4u-google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      googleMapsLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });
  return googleMapsLoadingPromise;
}

export const DeliveryGoogleMap: React.FC<DeliveryGoogleMapProps> = ({
  activeDeliveries,
  selectedDeliveryId,
  onSelectDelivery,
  storeId = 1,
  storeName,
  socket,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const storeMarkerRef = useRef<any>(null);
  const riderMarkersRef = useRef<Map<number, any>>(new Map());
  const activeInfoWindowRef = useRef<any>(null);

  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'missing_key' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [riderLocations, setRiderLocations] = useState<Map<number, RiderLocationData>>(new Map());

  // Store coordinates
  const storeCoord = STORE_COORDINATES[storeId] || { lat: 31.4704, lng: 74.4102, name: storeName || 'D4U Store' };

  // 1. Listen for real-time socket events: rider_location & rider_location_removed
  useEffect(() => {
    if (!socket) return;

    const handleRiderLocation = (data: RiderLocationData) => {
      if (!data || !data.riderId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
      if (data.storeId && Number(data.storeId) !== Number(storeId)) return;

      setRiderLocations(prev => {
        const next = new Map(prev);
        const existing = next.get(Number(data.riderId)) || {};
        next.set(Number(data.riderId), {
          ...existing,
          ...data,
          riderId: Number(data.riderId),
          timestamp: data.timestamp || Date.now(),
        });
        return next;
      });
    };

    const handleRiderLocationRemoved = (data: { riderId: number; storeId?: number }) => {
      if (!data || !data.riderId) return;
      setRiderLocations(prev => {
        const next = new Map(prev);
        next.delete(Number(data.riderId));
        return next;
      });
    };

    socket.on('rider_location', handleRiderLocation);
    socket.on('rider_location_removed', handleRiderLocationRemoved);

    // Request active rider locations on mount / reconnect
    if (socket.connected) {
      socket.emit('get_store_rider_locations', { storeId }, (response: any[]) => {
        if (Array.isArray(response)) {
          setRiderLocations(prev => {
            const next = new Map(prev);
            response.forEach(loc => {
              if (loc && loc.riderId) next.set(Number(loc.riderId), loc);
            });
            return next;
          });
        }
      });
    }

    return () => {
      socket.off('rider_location', handleRiderLocation);
      socket.off('rider_location_removed', handleRiderLocationRemoved);
    };
  }, [socket, storeId]);

  // 2. Fetch initial rider availability list from backend REST API
  useEffect(() => {
    if (!storeId) return;
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : 'https://pos-api.deziner4you.com';

    fetch(`${BACKEND_URL}/rider-orders/availability?store_id=${storeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('d4u_token') || ''}`,
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.riders)) {
          setRiderLocations(prev => {
            const next = new Map(prev);
            data.riders.forEach((r: any) => {
              if (r.lat != null && r.lng != null && !isNaN(Number(r.lat)) && !isNaN(Number(r.lng))) {
                next.set(Number(r.id), {
                  riderId: Number(r.id),
                  name: r.name,
                  phone: r.phone,
                  status: r.isOnline ? (r.isBusy ? 'BUSY' : 'AVAILABLE') : 'OFFLINE',
                  lat: Number(r.lat),
                  lng: Number(r.lng),
                  accuracy: r.accuracy ?? null,
                  timestamp: r.lastSeen ? new Date(r.lastSeen).getTime() : Date.now(),
                });
              }
            });
            return next;
          });
        }
      })
      .catch(() => {});
  }, [storeId]);

  // 3. Initialize Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setMapStatus('missing_key');
      return;
    }

    let isMounted = true;
    loadGoogleMapsApi(apiKey)
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) {
          setMapStatus('error');
          setErrorMessage('Google Maps script loaded but google.maps namespace is unavailable.');
          return;
        }

        // Initialize Map
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: storeCoord.lat, lng: storeCoord.lng },
          zoom: 13,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;

        // Add Restaurant Store Marker
        const storeSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        `;
        const storeMarker = new google.maps.Marker({
          position: { lat: storeCoord.lat, lng: storeCoord.lng },
          map,
          title: `Store: ${storeCoord.name}`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(storeSvg)}`,
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18),
          },
          zIndex: 100,
        });

        const storeInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #0f172a; padding: 6px 10px; font-family: sans-serif;">
              <strong style="font-size: 14px;">🏪 ${storeCoord.name}</strong>
              <div style="font-size: 12px; color: #475569; margin-top: 2px;">Store Base Location (Store #${storeId})</div>
            </div>
          `,
        });

        storeMarker.addListener('click', () => {
          storeInfoWindow.open(map, storeMarker);
        });

        storeMarkerRef.current = storeMarker;
        setMapStatus('ready');
      })
      .catch((err) => {
        if (!isMounted) return;
        setMapStatus('error');
        setErrorMessage(err?.message || 'Failed to load Google Maps script. Check network or API key restrictions.');
      });

    return () => {
      isMounted = false;
      // Clean up markers
      riderMarkersRef.current.forEach(marker => marker.setMap(null));
      riderMarkersRef.current.clear();
      if (storeMarkerRef.current) {
        storeMarkerRef.current.setMap(null);
        storeMarkerRef.current = null;
      }
    };
  }, [storeId, storeCoord.lat, storeCoord.lng, storeCoord.name]);

  // 4. Update / create rider markers when riderLocations or activeDeliveries change
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const map = mapInstanceRef.current;
    const currentMarkerMap = riderMarkersRef.current;

    // Track active rider IDs to clean up disappeared markers
    const currentActiveRiderIds = new Set<number>();

    riderLocations.forEach((loc, riderId) => {
      currentActiveRiderIds.add(riderId);

      // Check if rider is currently assigned to an active delivery
      const assignedDelivery = activeDeliveries.find(d => Number(d.claimedByRiderId) === Number(riderId));
      const riderName = loc.name || (assignedDelivery ? assignedDelivery.rider : `Rider #${riderId}`);
      const isBusy = !!assignedDelivery || loc.status === 'BUSY';
      const isOffline = loc.status === 'OFFLINE';

      // Colors: Available = Emerald (#10b981), Busy/Delivering = Amber (#f59e0b), Offline = Gray (#64748b)
      const markerColor = isOffline ? '#64748b' : (isBusy ? '#f59e0b' : '#10b981');
      const statusLabel = isOffline ? 'Offline' : (isBusy ? 'On Delivery' : 'Available');

      const riderSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${markerColor}" stroke="#ffffff" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" fill="${markerColor}" fill-opacity="0.9" />
          <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="#ffffff" />
        </svg>
      `;

      let marker = currentMarkerMap.get(riderId);
      const position = { lat: loc.lat, lng: loc.lng };

      if (!marker) {
        marker = new google.maps.Marker({
          position,
          map,
          title: `${riderName} (${statusLabel})`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(riderSvg)}`,
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18),
          },
          zIndex: isBusy ? 90 : 80,
        });

        marker.addListener('click', () => {
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();

          const infoContent = `
            <div style="color: #0f172a; padding: 8px 12px; font-family: sans-serif; min-width: 180px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 14px; color: #0f172a;">${riderName}</strong>
                <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: ${markerColor}20; color: ${markerColor}; font-weight: bold;">${statusLabel}</span>
              </div>
              ${assignedDelivery ? `
                <div style="font-size: 12px; color: #1e293b; background: #f1f5f9; padding: 4px 6px; border-radius: 4px; margin-top: 4px;">
                  📦 Delivering <strong>Order #${assignedDelivery.id}</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">${assignedDelivery.customerAddress || ''}</span>
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                📍 GPS: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}<br/>
                ${loc.accuracy ? `🎯 Accuracy: ±${Math.round(loc.accuracy)}m<br/>` : ''}
                ⏱️ Updated: ${new Date(loc.timestamp || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          `;

          const infoWindow = new google.maps.InfoWindow({ content: infoContent });
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;

          if (assignedDelivery && onSelectDelivery) {
            onSelectDelivery(assignedDelivery.id);
          }
        });

        currentMarkerMap.set(riderId, marker);
      } else {
        // Smoothly update existing marker
        marker.setPosition(position);
        marker.setTitle(`${riderName} (${statusLabel})`);
        marker.setIcon({
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(riderSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        });
      }
    });

    // Remove riders that are no longer in locations list
    currentMarkerMap.forEach((marker, id) => {
      if (!currentActiveRiderIds.has(id)) {
        marker.setMap(null);
        currentMarkerMap.delete(id);
      }
    });
  }, [riderLocations, activeDeliveries, mapStatus, onSelectDelivery]);

  // 5. Center map on selected delivery's rider if selected
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !selectedDeliveryId) return;
    const selectedDel = activeDeliveries.find(d => d.id === selectedDeliveryId);
    if (!selectedDel || !selectedDel.claimedByRiderId) return;

    const riderLoc = riderLocations.get(Number(selectedDel.claimedByRiderId));
    if (riderLoc && typeof riderLoc.lat === 'number' && typeof riderLoc.lng === 'number') {
      mapInstanceRef.current.panTo({ lat: riderLoc.lat, lng: riderLoc.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedDeliveryId, activeDeliveries, riderLocations, mapStatus]);

  // Controls: Zoom in / out / center on store / fit all
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  const handleCenterStore = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: storeCoord.lat, lng: storeCoord.lng });
    mapInstanceRef.current.setZoom(13);
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: storeCoord.lat, lng: storeCoord.lng });
    let count = 1;

    riderLocations.forEach((loc) => {
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
        count++;
      }
    });

    if (count > 1) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    } else {
      handleCenterStore();
    }
  };

  // Convert map to array for telemetry list
  const riderList = Array.from(riderLocations.values());
  const selectedDel = activeDeliveries.find(d => d.id === selectedDeliveryId) || activeDeliveries[0];

  return (
    <div className="delivery-map-section relative w-full h-full min-h-[420px] bg-[#070e1d] rounded-xl overflow-hidden flex flex-col border border-slate-800 shadow-2xl">
      {/* MAP STATUS BARS & OVERLAYS */}
      
      {/* Case 1: Missing API Key Fallback — Sleek Realtime Telemetry HUD */}
      {mapStatus === 'missing_key' && (
        <div className="absolute inset-0 flex flex-col bg-[#070e1d] p-6 z-20 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="text-amber-300 font-bold text-sm tracking-wide">
                Google Maps API Key Notice
              </div>
              <div className="text-slate-300 text-xs mt-1 leading-relaxed">
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> is not configured in the environment. 
                Falling back to real-time GPS telemetry monitor below. All live GPS socket streaming and rider tracking remain fully operational.
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </div>
          </div>

          {/* Store Badge */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-blue-400" />
              <span>Base Station: <strong className="text-white">{storeCoord.name}</strong> (Store #{storeId})</span>
            </div>
            <div className="font-mono text-slate-400">
              {storeCoord.lat.toFixed(4)}° N, {storeCoord.lng.toFixed(4)}° E
            </div>
          </div>

          {/* Riders List / Cards */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Connected Store Riders ({riderList.length})</span>
              <span>GPS Telemetry</span>
            </div>

            {riderList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 gap-3 border border-dashed border-slate-800 rounded-xl">
                <Radio size={32} className="text-slate-600 animate-pulse" />
                <div className="text-sm font-medium">No live rider GPS signals received yet for Store #{storeId}</div>
                <div className="text-xs text-slate-600 max-w-sm text-center">
                  When a rider logs into the Rider App and enables GPS tracking, their live coordinates will stream here in real time.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riderList.map((r) => {
                  const assignedOrder = activeDeliveries.find(d => Number(d.claimedByRiderId) === Number(r.riderId));
                  const isBusy = !!assignedOrder || r.status === 'BUSY';
                  return (
                    <div 
                      key={r.riderId}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col gap-2 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                          <span className="font-bold text-white text-sm">
                            {r.name || `Rider #${r.riderId}`}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isBusy ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isBusy ? 'On Delivery' : 'Available'}
                        </span>
                      </div>

                      {assignedOrder && (
                        <div className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1.5 rounded-md flex items-center justify-between border border-slate-700/50">
                          <span>Order #{assignedOrder.id}</span>
                          <span className="text-slate-400 truncate max-w-[150px]">{assignedOrder.customerAddress || ''}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg text-slate-400 border border-slate-900">
                        <div>LAT: <span className="text-emerald-400">{r.lat.toFixed(5)}</span></div>
                        <div>LNG: <span className="text-emerald-400">{r.lng.toFixed(5)}</span></div>
                        {r.accuracy && <div>ACC: <span className="text-blue-400">±{Math.round(r.accuracy)}m</span></div>}
                        <div>UPD: <span className="text-slate-300">{new Date(r.timestamp || Date.now()).toLocaleTimeString()}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case 2: Error loading Google Maps Script */}
      {mapStatus === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#070e1d] z-20 text-center">
          <AlertTriangle size={36} className="text-red-400 mb-2" />
          <div className="text-white font-bold text-sm mb-1">Failed to initialize Google Maps</div>
          <div className="text-slate-400 text-xs max-w-md mb-4">{errorMessage}</div>
          <button
            onClick={() => {
              setMapStatus('loading');
              const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
              if (apiKey) loadGoogleMapsApi(apiKey).then(() => setMapStatus('ready')).catch(() => setMapStatus('error'));
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            <RefreshCw size={14} /> Retry Map Loading
          </button>
        </div>
      )}

      {/* Case 3: Interactive Google Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full flex-1 z-10" 
        style={{ minHeight: '380px', display: mapStatus === 'missing_key' ? 'none' : 'block' }} 
      />

      {/* MAP CONTROLS OVERLAY (When Map is Ready) */}
      {mapStatus === 'ready' && (
        <>
          {/* Top Left Live Status Card */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <div className="flex flex-col">
                <span className="text-white text-xs font-bold">{storeCoord.name}</span>
                <span className="text-slate-400 text-[10px]">
                  {riderList.length} Rider{riderList.length !== 1 ? 's' : ''} Online
                </span>
              </div>
            </div>

            {selectedDel && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-slate-200 shadow-xl max-w-xs">
                <Navigation size={14} className="text-amber-400 flex-shrink-0" />
                <span className="truncate">Tracking <strong>Order #{selectedDel.id}</strong> ({selectedDel.rider || 'Unassigned'})</span>
              </div>
            )}
          </div>

          {/* Bottom Right Floating Controls */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 shadow-2xl">
            <button
              onClick={handleFitAll}
              title="Fit Store & All Riders"
              className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <Compass size={17} />
            </button>
            <button
              onClick={handleCenterStore}
              title="Center on Restaurant"
              className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <Store size={17} />
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <ZoomIn size={17} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <ZoomOut size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryGoogleMap;
