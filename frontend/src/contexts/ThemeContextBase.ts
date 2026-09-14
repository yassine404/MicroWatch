import { createContext } from 'react';

export interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);