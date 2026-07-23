import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

interface Store {
  id: number;
  name: string;
  location?: string;
  brand_id?: number;
  today_orders?: number; // mock
  today_sales?: number;  // mock
}

interface Brand {
  id: number;
  name: string;
  is_chain_store: boolean;
  stores: Store[];
}

interface AdminContextType {
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  activeBrandId: number | null;
  setActiveBrandId: (id: number | null) => void;
  branches: Store[];
  brands: Brand[];
  isBranchEntered: boolean;
  setIsBranchEntered: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    return Number(localStorage.getItem('adminSelectedBranchId')) || null;
  });
  const [activeBrandId, setActiveBrandId] = useState<number | null>(() => {
    return Number(localStorage.getItem('adminActiveBrandId')) || null;
  });
  const [isBranchEntered, setIsBranchEntered] = useState<boolean>(() => {
    return localStorage.getItem('adminIsBranchEntered') === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('d4u_admin_token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    // Fetch Stores
    fetch(`${BACKEND_URL}/stores`, { headers })
      .then(res => res.json())
      .then(data => {
        setBranches(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    // Fetch Brands
    fetch(`${BACKEND_URL}/stores/brands`, { headers })
      .then(res => res.json())
      .then(data => {
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('adminSelectedBranchId', selectedBranchId.toString());
      // Auto-update activeBrandId if a specific branch is selected
      if (brands.length > 0) {
        const brand = brands.find(b => b.stores?.some(s => s.id === selectedBranchId));
        if (brand) {
          setActiveBrandId(brand.id);
          localStorage.setItem('adminActiveBrandId', brand.id.toString());
        }
      }
    } else {
      localStorage.removeItem('adminSelectedBranchId');
    }
  }, [selectedBranchId, brands]);

  useEffect(() => {
    if (activeBrandId) {
      localStorage.setItem('adminActiveBrandId', activeBrandId.toString());
    } else {
      localStorage.removeItem('adminActiveBrandId');
    }
  }, [activeBrandId]);

  useEffect(() => {
    localStorage.setItem('adminIsBranchEntered', isBranchEntered.toString());
  }, [isBranchEntered]);

  return (
    <AdminContext.Provider value={{ selectedBranchId, setSelectedBranchId, activeBrandId, setActiveBrandId, branches, brands, isBranchEntered, setIsBranchEntered }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}
