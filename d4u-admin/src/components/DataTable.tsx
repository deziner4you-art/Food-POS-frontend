import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  storageKey: string;
  defaultPageSize?: number;
  searchQuery?: string;
  searchFields?: string[];
  selection?: {
    selectedIds: number[];
    onSelect: (ids: number[]) => void;
    getId: (item: T) => number;
  };
}

export function DataTable<T>({ 
  data, 
  columns, 
  storageKey, 
  defaultPageSize = 10,
  searchQuery = '',
  searchFields = [],
  selection
}: DataTableProps<T>) {
  // Restore state from sessionStorage
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>(() => {
    const saved = sessionStorage.getItem(`${storageKey}_sort`);
    return saved ? JSON.parse(saved) : { key: '', direction: 'asc' };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = sessionStorage.getItem(`${storageKey}_pageSize`);
    return saved ? parseInt(saved) : defaultPageSize;
  });

  // Persist state
  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_sort`, JSON.stringify(sortConfig));
  }, [sortConfig, storageKey]);
  
  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_pageSize`, pageSize.toString());
  }, [pageSize, storageKey]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery && searchFields.length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        return searchFields.some(field => {
          const val = (item as any)[field];
          return val && String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortConfig.direction === 'asc' ? -1 : 1;

        const comp = valA > valB ? 1 : -1;
        return sortConfig.direction === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, sortConfig]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const allSelectedOnPage = paginatedData.length > 0 && paginatedData.every(item => selection?.selectedIds.includes(selection.getId(item)));

  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    const pageIds = paginatedData.map(item => selection.getId(item));
    if (checked) {
      const newSelection = Array.from(new Set([...selection.selectedIds, ...pageIds]));
      selection.onSelect(newSelection);
    } else {
      const newSelection = selection.selectedIds.filter(id => !pageIds.includes(id));
      selection.onSelect(newSelection);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (!selection) return;
    if (checked) {
      selection.onSelect([...selection.selectedIds, id]);
    } else {
      selection.onSelect(selection.selectedIds.filter(sid => sid !== id));
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <div className="flex-1 overflow-auto rounded-t-lg border border-slate-700 bg-slate-900/50 relative">
        <table className="w-full text-left text-sm text-slate-300 border-collapse min-w-max">
          <thead className="bg-slate-800 text-slate-400 sticky top-0 z-10 text-xs uppercase font-bold shadow-md shadow-slate-900/20">
            <tr>
              {selection && (
                <th className="p-4 w-12 border-b border-slate-700">
                  <input 
                    type="checkbox" 
                    className="accent-[#fbbf24] cursor-pointer"
                    checked={allSelectedOnPage}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={`p-4 border-b border-slate-700 whitespace-nowrap ${col.sortable !== false ? 'cursor-pointer hover:text-white select-none group' : ''}`}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      <span className="text-[#fbbf24]">
                        {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, idx) => {
              const id = selection?.getId(item) || idx;
              const isSelected = selection?.selectedIds.includes(id);
              return (
                <tr key={id} className={`border-b border-slate-700/50 hover:bg-slate-800/80 transition-colors ${isSelected ? 'bg-[#fbbf24]/10' : ''}`}>
                  {selection && (
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="accent-[#fbbf24] cursor-pointer"
                        checked={isSelected}
                        onChange={e => handleSelectItem(id, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className="p-4 align-middle">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="p-8 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="bg-slate-800 border border-t-0 border-slate-700 rounded-b-lg p-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-300">Total: {processedData.length}</span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select 
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-600 rounded p-1 text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
