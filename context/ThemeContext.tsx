import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

export type AppTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} });

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = Appearance.getColorScheme() ?? 'light';
  const [theme, setTheme] = useState<AppTheme>(sys === 'dark' ? 'dark' : 'light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const saved = await AsyncStorage.getItem('appTheme');
        if (saved === 'light' || saved === 'dark') setTheme(saved);
      } catch {}
    })();
  }, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
