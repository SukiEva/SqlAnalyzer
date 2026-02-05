export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "hpv:theme";
const DEFAULT_THEME: ThemePreference = "light";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadThemePreference(): ThemePreference {
  if (!hasWindow()) return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
    return DEFAULT_THEME;
  } catch (err) {
    console.warn("Failed to load theme preference", err);
    return DEFAULT_THEME;
  }
}

export function saveThemePreference(theme: ThemePreference) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    console.error("Failed to save theme preference", err);
  }
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}
