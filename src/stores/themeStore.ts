import { create } from "zustand";

type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  hydrateTheme: () => void;
  toggleTheme: () => void;
};

const storageKey = "serialforge.theme";

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  hydrateTheme: () => {
    const storedTheme = window.localStorage.getItem(storageKey);
    const theme: Theme = storedTheme === "light" ? "light" : "dark";
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
