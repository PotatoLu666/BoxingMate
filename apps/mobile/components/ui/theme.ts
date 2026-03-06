import { useThemeMode } from '@/contexts/ThemeContext';

type Theme = 'light' | 'dark';

interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
}

const lightColors: ThemeColors = {
  bg: '#FFFFFF',
  surface: '#F3F4F6',
  surfaceAlt: '#F9FAFB',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#DC2626',
  primaryText: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
  overlay: 'rgba(0,0,0,0.6)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

const darkColors: ThemeColors = {
  bg: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceAlt: '#262626',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#374151',
  primary: '#EF4444',
  primaryText: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  inputBg: '#1A1A1A',
  inputBorder: '#374151',
  overlay: 'rgba(0,0,0,0.8)',
  tabBar: '#0A0A0A',
  tabBarBorder: '#1F2937',
};

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const { isDark } = useThemeMode();
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export { lightColors, darkColors };
export type { ThemeColors };
