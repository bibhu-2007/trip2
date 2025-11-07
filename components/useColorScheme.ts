import { useAppTheme } from '@/context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const { theme } = useAppTheme();
  return theme;
}
