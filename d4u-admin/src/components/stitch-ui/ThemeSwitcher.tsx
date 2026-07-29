import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { useStitchTheme } from '../../theme';
import type { StitchThemeName } from '../../theme';

const THEME_LABELS: Record<StitchThemeName, string> = {
  'gold-luxury': 'Gold Luxury',
  light: 'Light',
  dark: 'Dark',
  'blue-professional': 'Blue Professional',
  'green-nature': 'Green Nature',
  'red-premium': 'Red Premium',
};

export interface StitchThemeSwitcherProps {
  className?: string;
}

export function StitchThemeSwitcher({ className = '' }: StitchThemeSwitcherProps) {
  const { theme, setTheme, themes } = useStitchTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 bg-stitch-surface border border-stitch-border text-stitch-ink text-xs font-semibold px-3 py-2 rounded-xl hover:border-stitch-accent/50 transition-colors"
      >
        <Palette className="w-4 h-4 text-stitch-accent" />
        {THEME_LABELS[theme]}
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 mt-2 w-56 bg-stitch-panel border border-stitch-border rounded-xl shadow-2xl z-50 p-1.5 space-y-1"
        >
          {themes.map((themeName) => (
            <button
              key={themeName}
              type="button"
              role="option"
              aria-selected={theme === themeName}
              onClick={() => {
                setTheme(themeName);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                theme === themeName
                  ? 'bg-stitch-accent/15 text-stitch-accent'
                  : 'text-stitch-ink hover:bg-stitch-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  data-theme={themeName}
                  className="w-3.5 h-3.5 rounded-full bg-stitch-accent border border-stitch-border flex-shrink-0"
                  aria-hidden="true"
                />
                {THEME_LABELS[themeName]}
              </span>
              {theme === themeName && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default StitchThemeSwitcher;
