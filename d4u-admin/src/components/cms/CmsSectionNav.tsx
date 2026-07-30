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
        className={`flex items-center md:justify-center lg:justify-between justify-start gap-2 px-3 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
          isActive
            ? 'bg-stitch-accent text-stitch-accent-ink'
            : 'text-stitch-muted hover:bg-stitch-surface hover:text-stitch-ink'
        }`}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} aria-hidden="true" />
          <span className="md:hidden lg:inline">{label}</span>
        </span>
        <span
          className={`hidden lg:inline-block text-[0.6rem] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
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
    <nav
      aria-label="Website CMS sections"
      className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible bg-stitch-panel border border-stitch-border rounded-xl md:rounded-2xl p-2 md:w-16 lg:w-56 md:flex-none"
    >
      <div className="hidden lg:block px-3 pt-2 pb-3 text-[0.65rem] font-bold uppercase tracking-wider text-stitch-muted">
        Website CMS
      </div>

      {LIVE_ITEMS.map(renderItem)}

      <div className="hidden lg:block my-2 border-t border-dashed border-stitch-border" />

      {COMING_SOON_ITEMS.map(renderItem)}
    </nav>
  );
}
