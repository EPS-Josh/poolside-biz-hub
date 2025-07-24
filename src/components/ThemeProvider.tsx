
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;

    console.log('ThemeProvider: Applying theme:', theme);
    console.log('ThemeProvider: User agent:', navigator.userAgent);
    console.log('ThemeProvider: System prefers dark:', window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Remove all theme classes from both root and body
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      console.log('ThemeProvider: System theme detected:', systemTheme);

      // Apply theme to both root and body for better mobile compatibility
      root.classList.add(systemTheme);
      body.classList.add(systemTheme);
      
      // Add data attributes for better mobile compatibility
      root.setAttribute('data-theme', systemTheme);
      body.setAttribute('data-theme', systemTheme);
      
      // Force style recalculation on mobile
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        console.log('ThemeProvider: Mobile detected, forcing style recalculation');
        root.style.colorScheme = systemTheme;
        // Trigger repaint
        root.offsetHeight;
      }
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        console.log('ThemeProvider: System theme changed to:', e.matches ? 'dark' : 'light');
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');
        const newTheme = e.matches ? 'dark' : 'light';
        root.classList.add(newTheme);
        body.classList.add(newTheme);
        root.setAttribute('data-theme', newTheme);
        body.setAttribute('data-theme', newTheme);
        
        if (/Mobi|Android/i.test(navigator.userAgent)) {
          root.style.colorScheme = newTheme;
          root.offsetHeight;
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      console.log('ThemeProvider: Manual theme applied:', theme);
      root.classList.add(theme);
      body.classList.add(theme);
      root.setAttribute('data-theme', theme);
      body.setAttribute('data-theme', theme);
      
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        root.style.colorScheme = theme;
        root.offsetHeight;
      }
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      console.log('ThemeProvider: Setting theme to:', theme);
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
