import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

const THEME_KEY = "bs.theme";
const FONT_KEY = "bs.dyslexicFont";
const CONTRAST_KEY = "bs.highContrast";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  dyslexiaFont: boolean;
  setDyslexiaFont: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readBool(key: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function readInitialTheme(): Theme {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  const [dyslexiaFont, setDyslexiaFontState] = useState<boolean>(() => readBool(FONT_KEY));
  const [highContrast, setHighContrastState] = useState<boolean>(() => readBool(CONTRAST_KEY));

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dyslexic", dyslexiaFont);
    try {
      localStorage.setItem(FONT_KEY, String(dyslexiaFont));
    } catch {
      /* ignore */
    }
  }, [dyslexiaFont]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("contrast", highContrast);
    try {
      localStorage.setItem(CONTRAST_KEY, String(highContrast));
    } catch {
      /* ignore */
    }
  }, [highContrast]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );
  const setDyslexiaFont = useCallback((v: boolean) => setDyslexiaFontState(v), []);
  const setHighContrast = useCallback((v: boolean) => setHighContrastState(v), []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      dyslexiaFont,
      setDyslexiaFont,
      highContrast,
      setHighContrast,
    }),
    [theme, toggleTheme, setTheme, dyslexiaFont, setDyslexiaFont, highContrast, setHighContrast]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
