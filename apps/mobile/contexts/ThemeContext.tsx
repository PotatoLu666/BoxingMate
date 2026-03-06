import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'theme' });

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = storage.getString('themeMode');
    return (stored as ThemeMode) || 'system';
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    storage.set('themeMode', newMode);
  };

  const isDark =
    mode === 'system' ? deviceScheme === 'dark' : mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
