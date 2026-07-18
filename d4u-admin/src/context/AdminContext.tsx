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
  const [isBranchEntered, setIsBranchEntered] = useState<boolean>(() => {
    return localStorage.getItem('adminIsBranchEntered') === 'true';
  });

  useEffect(() => {
    // Fetch Stores
    fetch(`${BACKEND_URL}/stores`)
      .then(res => res.json())
      .then(data => {
        setBranches(data);
      })
      .catch(console.error);

    // Fetch Brands
    fetch(`${BACKEND_URL}/stores/brands`)
      .then(res => res.json())
      .then(data => {
        setBrands(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('adminSelectedBranchId', selectedBranchId.toString());
    }
  }, [selectedBranchId]);

  useEffect(() => {
    localStorage.setItem('adminIsBranchEntered', isBranchEntered.toString());
  }, [isBranchEntered]);

  return (
    <AdminContext.Provider value={{ selectedBranchId, setSelectedBranchId, branches, brands, isBranchEntered, setIsBranchEntered }}>
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
