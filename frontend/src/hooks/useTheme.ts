import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContextBase';

export const useTheme = () => useContext(ThemeContext);