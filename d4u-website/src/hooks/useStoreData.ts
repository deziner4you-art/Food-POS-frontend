import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { FoodItem, StoreSummary } from '../types';

export const BACKEND_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://pos-api.deziner4you.com';

export function useStores() {
  const [stores, setStores] = useState<StoreSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/stores`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (!cancelled) setStores(data || []); })
      .catch((err) => console.error('Failed to fetch stores:', err));
    return () => { cancelled = true; };
  }, []);

  return stores;
}

/**
 * Single owner of the per-store fetch lifecycle and the single socket.io
 * connection. Every page/route consumes this instead of opening its own
 * fetches or its own `io(BACKEND_URL)` — the legacy components each opened
 * their own module-scope socket, which meant up to three simultaneous
 * connections per page load regardless of which view actually rendered.
 */
export function useStoreData(storeId: number | null) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [orderUpdate, setOrderUpdate] = useState<any>(null);
  // Rider position broadcast by RiderService.updateRiderGps — same simulated
  // coordinate scheme already driving the POS delivery map, just also
  // exposed here so TrackOrderPage can render it. { orderId, lat, lng }.
  const [riderPosition, setRiderPosition] = useState<{ orderId: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/catalog/category-groups/hierarchy/store/${storeId}?channel=website`);
        if (!res.ok) return;
        const data = await res.json();
        const allProducts: any[] = [];

        if (data.category_groups) {
          data.category_groups.forEach((group: any) => {
            (group.categories || []).forEach((cat: any) => {
              (cat.products || []).forEach((p: any) => {
                allProducts.push({ ...p, __catName: cat.name, __groupName: group.name });
              });
            });
          });
        }
        if (data.categories) {
          data.categories.forEach((cat: any) => {
            (cat.products || []).forEach((p: any) => {
              allProducts.push({ ...p, __catName: cat.name, __groupName: undefined });
            });
          });
        }

        const mappedItems: FoodItem[] = allProducts.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          priceRs: p.price,
          priceUSD: parseFloat((p.price / 280).toFixed(2)),
          description: p.sku || 'Delicious item from our menu',
          image: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
          category: p.__catName,
          categoryGroup: p.__groupName,
          tag: undefined,
          preparationTime: '10 mins',
          calories: 500,
          variants: p.variants || [],
          modifierGroups: p.modifierGroups || [],
          categories: p.categories || [],
        }));

        const uniqueItemsMap = new Map(mappedItems.map((item) => [item.id, item]));
        setFoodItems(Array.from(uniqueItemsMap.values()));
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      }
    };

    const fetchCMS = async () => {
      try {
        const [bannersRes, settingsRes, campaignsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/cms/banners`),
          fetch(`${BACKEND_URL}/cms/settings/${storeId}`),
          fetch(`${BACKEND_URL}/marketing/campaign/visible?store_id=${storeId}&channel=web`),
        ]);
        if (bannersRes.ok) setBanners(await bannersRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      } catch (e) {
        console.error(e);
      }
    };

    fetchCatalog();
    fetchCMS();

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_store', { store_id: storeId });
    });

    socket.on('marketing_update', () => {
      fetch(`${BACKEND_URL}/marketing/campaign/visible?store_id=${storeId}&channel=web`)
        .then((res) => res.json())
        .then(setCampaigns)
        .catch(console.error);
    });

    socket.on('order_updated', (updatedOrder: any) => {
      setOrderUpdate(updatedOrder);
    });

    socket.on('gps_update', (data: { orderId: number; lat: number; lng: number }) => {
      setRiderPosition(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId]);

  return { foodItems, banners, campaigns, settings, socket: socketRef.current, orderUpdate, riderPosition };
}
