import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

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
  dirtyModules: Record<string, boolean>;
  setModuleDirty: (moduleName: string, isDirty: boolean) => void;
  checkWorkspaceDirty: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Store[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    return Number(sessionStorage.getItem('adminSelectedBranchId')) || null;
  });
  const [activeBrandId, setActiveBrandId] = useState<number | null>(() => {
    return Number(sessionStorage.getItem('adminActiveBrandId')) || null;
  });
  const [isBranchEntered, setIsBranchEntered] = useState<boolean>(() => {
    return sessionStorage.getItem('adminIsBranchEntered') === 'true';
  });
  const [dirtyModules, setDirtyModules] = useState<Record<string, boolean>>({});

  const setModuleDirty = (moduleName: string, isDirty: boolean) => {
    setDirtyModules(prev => ({ ...prev, [moduleName]: isDirty }));
  };

  const checkWorkspaceDirty = () => {
    // Return true if ANY module is dirty (or could enhance to check active only)
    return Object.values(dirtyModules).some(isDirty => isDirty);
  };

  useEffect(() => {
    
    

    const fetchData = async () => {
      try {
        const [brandsRes, branchesRes] = await Promise.all([
          apiFetch('/stores/brands'),
          apiFetch('/stores')
        ]);
        const brandsData = await brandsRes.json();
        const branchesData = await branchesRes.json();
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      sessionStorage.setItem('adminSelectedBranchId', selectedBranchId.toString());
      // Auto-update activeBrandId if a specific branch is selected
      if (brands.length > 0) {
        const brand = brands.find(b => b.stores?.some(s => s.id === selectedBranchId));
        if (brand) {
          setActiveBrandId(brand.id);
          sessionStorage.setItem('adminActiveBrandId', brand.id.toString());
        }
      }
    } else {
      sessionStorage.removeItem('adminSelectedBranchId');
    }
  }, [selectedBranchId, brands]);

  useEffect(() => {
    if (activeBrandId) {
      sessionStorage.setItem('adminActiveBrandId', activeBrandId.toString());
    } else {
      sessionStorage.removeItem('adminActiveBrandId');
    }
  }, [activeBrandId]);

  useEffect(() => {
    sessionStorage.setItem('adminIsBranchEntered', isBranchEntered.toString());
  }, [isBranchEntered]);

  return (
    <AdminContext.Provider value={{ 
      selectedBranchId, setSelectedBranchId, 
      activeBrandId, setActiveBrandId, 
      branches, brands, 
      isBranchEntered, setIsBranchEntered,
      dirtyModules, setModuleDirty, checkWorkspaceDirty
    }}>
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
