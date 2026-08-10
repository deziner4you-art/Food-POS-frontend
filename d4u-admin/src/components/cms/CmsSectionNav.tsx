import { LayoutTemplate, Globe, SlidersHorizontal, Search, FileText, Images } from 'lucide-react';

export type CmsTab = 'BANNERS' | 'SETTINGS' | 'MODULES' | 'SEO' | 'PAGES' | 'MEDIA';

interface CmsSectionNavProps {
  activeTab: CmsTab;
  onChangeTab: (tab: CmsTab) => void;
}

interface NavItem {
  tab: CmsTab;
  label: string;
  icon: typeof LayoutTemplate;
  status: 'live' | 'soon';
}

const LIVE_ITEMS: NavItem[] = [
  { tab: 'BANNERS', label: 'Hero & Banners', icon: LayoutTemplate, status: 'live' },
  { tab: 'SETTINGS', label: 'Site Settings', icon: Globe, status: 'live' },
  { tab: 'MODULES', label: 'System Modules', icon: SlidersHorizontal, status: 'live' },
];

const COMING_SOON_ITEMS: NavItem[] = [
  { tab: 'SEO', label: 'SEO', icon: Search, status: 'soon' },
  { tab: 'PAGES', label: 'Pages', icon: FileText, status: 'soon' },
  { tab: 'MEDIA', label: 'Media Library', icon: Images, status: 'soon' },
];

// Top Bar Tabs — same horizontal pattern as MenuManager's "Menu Products
// Engine" tab row (Menu Collections / Categories / ... buttons), used here
// instead of a left sidebar so Website CMS matches the rest of Admin.
export default function CmsSectionNav({ activeTab, onChangeTab }: CmsSectionNavProps) {
  const renderItem = ({ tab, label, icon: Icon, status }: NavItem) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        type="button"
        title={label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => onChangeTab(tab)}
        className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm whitespace-nowrap ${
          isActive
            ? 'bg-stitch-accent text-stitch-accent-ink accent-glow'
            : 'bg-stitch-panel text-stitch-muted hover:bg-stitch-surface'
        }`}
      >
        <Icon size={16} aria-hidden="true" />
        {label}
        <span
          className={`text-[0.55rem] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
            isActive
              ? 'bg-black/20 text-stitch-accent-ink'
              : status === 'live'
                ? 'bg-stitch-success/20 text-stitch-success'
                : 'bg-stitch-muted/10 text-stitch-muted'
          }`}
        >
          {status === 'live' ? 'Live' : 'Soon'}
        </span>
      </button>
    );
  };

  return (
    <nav aria-label="Website CMS sections" className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
      {LIVE_ITEMS.map(renderItem)}
      <div className="w-px my-1 bg-stitch-border" />
      {COMING_SOON_ITEMS.map(renderItem)}
    </nav>
  );
}
