import type { ReactNode } from 'react';
import CmsSectionNav, { type CmsTab } from './CmsSectionNav';
import StickySaveBar from './StickySaveBar';

const SECTION_TITLES: Record<CmsTab, string> = {
  BANNERS: 'Hero & Banners',
  SETTINGS: 'Site Settings',
  MODULES: 'System Modules',
};

interface CmsShellProps {
  activeTab: CmsTab;
  onChangeTab: (tab: CmsTab) => void;
  branchSelector: ReactNode;
  isDirty: boolean;
  isSaving: boolean;
  successMsg?: string;
  onSave: (e: any) => void;
  children: ReactNode;
}

export default function CmsShell({
  activeTab,
  onChangeTab,
  branchSelector,
  isDirty,
  isSaving,
  successMsg,
  onSave,
  children,
}: CmsShellProps) {
  return (
    <div className="animate-fade-in flex flex-col md:flex-row gap-6 h-[calc(100vh-160px)]">
      <CmsSectionNav activeTab={activeTab} onChangeTab={onChangeTab} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-stitch-ink flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-stitch-accent" />
            {SECTION_TITLES[activeTab]}
          </h2>
          {branchSelector}
        </div>

        <StickySaveBar isDirty={isDirty} isSaving={isSaving} successMsg={successMsg} onSave={onSave} />

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
