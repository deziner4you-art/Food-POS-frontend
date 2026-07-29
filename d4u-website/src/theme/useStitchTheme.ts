import { useEffect, useState } from 'react';
import { applyStitchTheme, getStoredStitchTheme, STITCH_THEMES, type StitchThemeName } from './theme-engine';

export function useStitchTheme() {
  const [theme, setTheme] = useState<StitchThemeName>(() => getStoredStitchTheme());

  useEffect(() => {
    applyStitchTheme(theme);
  }, [theme]);

  return { theme, setTheme, themes: STITCH_THEMES };
}
