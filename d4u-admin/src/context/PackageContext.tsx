import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export interface PackageModule {
  id: number;
  module_key: string;
  price: number;
}

export interface SaaSPackage {
  id: number;
  code: string;
  name: string;
  description?: string;
  currency: string;
  monthly_rental: number;
  billing_cycle: string;
  status: string;
  discount_pct: number;
  total_value: number;
  modules: PackageModule[];
}

interface PackageContextType {
  packages: SaaSPackage[];
  activePackages: SaaSPackage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const PackageContext = createContext<PackageContextType | undefined>(undefined);

export function PackageProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = useState<SaaSPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/subscription/package');
      if (res.ok) {
        const data = await res.json();
        setPackages(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load packages.');
      }
    } catch (e) {
      setError('Network error while loading packages.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const activePackages = packages.filter((p) => p.status === 'ACTIVE');

  return (
    <PackageContext.Provider value={{ packages, activePackages, isLoading, error, refetch: fetchPackages }}>
      {children}
    </PackageContext.Provider>
  );
}

export function usePackageContext() {
  const context = useContext(PackageContext);
  if (context === undefined) {
    throw new Error('usePackageContext must be used within a PackageProvider');
  }
  return context;
}
