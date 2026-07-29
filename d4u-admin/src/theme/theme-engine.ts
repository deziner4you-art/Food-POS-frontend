/**
 * Framework-agnostic Stitch theme engine — plain TS/DOM, no React import.
 * Same file is intended to be dropped into any D4U frontend (Website, CMS,
 * POS, future modules) unchanged; only useStitchTheme.ts is React-specific.
 */

export const STITCH_THEMES = [
  'gold-luxury',
  'light',
  'dark',
  'blue-professional',
  'green-nature',
  'red-premium',
] as const;

export type StitchThemeName = (typeof STITCH_THEMES)[number];

export const DEFAULT_STITCH_THEME: StitchThemeName = 'gold-luxury';

const STORAGE_KEY = 'd4u_stitch_theme';

export function isStitchThemeName(value: string | null): value is StitchThemeName {
  return !!value && (STITCH_THEMES as readonly string[]).includes(value);
}

export function getStoredStitchTheme(): StitchThemeName {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isStitchThemeName(stored) ? stored : DEFAULT_STITCH_THEME;
}

export function applyStitchTheme(theme: StitchThemeName): void {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function initStitchTheme(): StitchThemeName {
  const theme = getStoredStitchTheme();
  applyStitchTheme(theme);
  return theme;
}
