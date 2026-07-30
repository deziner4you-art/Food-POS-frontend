import { LayoutTemplate, Globe, SlidersHorizontal, Search, FileText, Images } from 'lucide-react';

export type CmsTab = 'BANNERS' | 'SETTINGS' | 'MODULES';

interface CmsSectionNavProps {
  activeTab: CmsTab;
  onChangeTab: (tab: CmsTab) => void;
}

const LIVE_ITEMS: { tab: CmsTab; label: string; icon: typeof LayoutTemplate }[] = [
  { tab: 'BANNERS', label: 'Hero & Banners', icon: LayoutTemplate },
  { tab: 'SETTINGS', label: 'Site Settings', icon: Globe },
  { tab: 'MODULES', label: 'System Modules', icon: SlidersHorizontal },
];

const COMING_SOON_ITEMS: { label: string; icon: typeof Search }[] = [
  { label: 'SEO', icon: Search },
  { label: 'Pages', icon: FileText },
  { label: 'Media Library', icon: Images },
];

export default function CmsSectionNav({ activeTab, onChangeTab }: CmsSectionNavProps) {
  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible bg-stitch-panel border border-stitch-border rounded-xl md:rounded-2xl p-2 md:w-56 md:flex-none">
      <div className="hidden md:block px-3 pt-2 pb-3 text-[0.65rem] font-bold uppercase tracking-wider text-stitch-muted">
        Website CMS
      </div>

      {LIVE_ITEMS.map(({ tab, label, icon: Icon }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChangeTab(tab)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-stitch-accent text-stitch-accent-ink'
                : 'text-stitch-muted hover:bg-stitch-surface hover:text-stitch-ink'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon size={16} /> {label}
            </span>
            <span
              className={`hidden sm:inline-block text-[0.6rem] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-black/20 text-stitch-accent-ink' : 'bg-stitch-success/20 text-stitch-success'
              }`}
            >
              Live
            </span>
          </button>
        );
      })}

      <div className="hidden md:block my-2 border-t border-dashed border-stitch-border" />

      {COMING_SOON_ITEMS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          disabled
          aria-disabled="true"
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap text-stitch-muted/50 cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <Icon size={16} /> {label}
          </span>
          <span className="hidden sm:inline-block text-[0.6rem] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-stitch-muted/10 text-stitch-muted">
            Soon
          </span>
        </button>
      ))}
    </nav>
  );
}
