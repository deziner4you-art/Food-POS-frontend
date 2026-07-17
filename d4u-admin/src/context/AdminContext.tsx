import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

interface Store {
  id: number;
  name: string;
}

interface AdminContextType {
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  branches: Store[];
  isBranchEntered: boolean;
  setIsBranchEntered: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Store[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    return Number(localStorage.getItem('adminSelectedBranchId')) || null;
  });
  const [isBranchEntered, setIsBranchEntered] = useState<boolean>(() => {
    return localStorage.getItem('adminIsBranchEntered') === 'true';
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/stores`)
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0 && !selectedBranchId) {
          setSelectedBranchId(data[0].id);
        }
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
    <AdminContext.Provider value={{ selectedBranchId, setSelectedBranchId, branches, isBranchEntered, setIsBranchEntered }}>
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
