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
  setSelectedBranchId: (id: number | null) => void;
  activeBrandId: number | null;
  setActiveBrandId: (id: number | null) => void;
  branches: Store[];
  brands: Brand[];
  isBranchEntered: boolean;
  setIsBranchEntered: (value: boolean) => void;
  dirtyModules: Record<string, boolean>;
  setModuleDirty: (moduleName: string, isDirty: boolean) => void;
  checkWorkspaceDirty: () => boolean;
  entitlementLoading: boolean;
  entitlementChecked: boolean;
  hasModule: (moduleKey: AdminModuleKey) => boolean;
}

export type AdminModuleKey =
  | 'pos'
  | 'inventory'
  | 'recipes'
  | 'vendors'
  | 'marketing'
  | 'crm'
  | 'cms'
  | 'rider'
  | 'analytics';

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
  const [entitlementLoading, setEntitlementLoading] = useState(false);
  const [entitlementChecked, setEntitlementChecked] = useState(false);
  const [capabilities, setCapabilities] = useState<Partial<Record<AdminModuleKey, boolean>>>({});

  const setModuleDirty = (moduleName: string, isDirty: boolean) => {
    setDirtyModules(prev => ({ ...prev, [moduleName]: isDirty }));
  };

  const checkWorkspaceDirty = () => {
    // Return true if ANY module is dirty (or could enhance to check active only)
    return Object.values(dirtyModules).some(isDirty => isDirty);
  };

  // The selected branch's active subscription is the only source of truth for
  // Admin feature visibility. Missing, invalid, expired, or failed lookups
  // intentionally produce an empty capability set (fail closed).
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('d4u_admin_token');
    if (!token || !selectedBranchId || !Number.isInteger(Number(selectedBranchId)) || Number(selectedBranchId) <= 0) {
      setCapabilities({});
      setEntitlementChecked(false);
      setEntitlementLoading(false);
      return;
    }

    setEntitlementLoading(true);
    setEntitlementChecked(false);
    setCapabilities({});
    apiFetch(`/subscription/entitlements/current?store_id=${selectedBranchId}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const source = data?.capabilities;
        setCapabilities(source && typeof source === 'object' ? {
          pos: source.pos === true,
          inventory: source.inventory === true,
          recipes: source.recipes === true,
          vendors: source.vendors === true,
          marketing: source.marketing === true,
          crm: source.crm === true,
          cms: source.cms === true,
          rider: source.rider === true,
          analytics: source.analytics === true,
        } : {});
        setEntitlementChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCapabilities({});
        setEntitlementChecked(true);
      })
      .finally(() => {
        if (!cancelled) setEntitlementLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedBranchId]);

  const hasModule = (moduleKey: AdminModuleKey) =>
    entitlementChecked && capabilities[moduleKey] === true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('d4u_admin_token');
        if (!token) return;
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
      dirtyModules,
      setModuleDirty,
      checkWorkspaceDirty,
      entitlementLoading,
      entitlementChecked,
      hasModule,
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
