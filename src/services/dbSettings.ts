export type DbDriver = "opengauss" | "dws" | "postgresql";

export interface DbSettings {
  driver: DbDriver;
  connectionString: string;
  username: string;
  password: string;
}

const STORAGE_KEY = "hpv:db-settings";

const defaultSettings: DbSettings = {
  driver: "opengauss",
  connectionString: "",
  username: "",
  password: "",
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadDbSettings(): DbSettings {
  if (!hasWindow()) return { ...defaultSettings };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<DbSettings>;
    return {
      driver: parsed.driver ?? defaultSettings.driver,
      connectionString: parsed.connectionString ?? defaultSettings.connectionString,
      username: parsed.username ?? defaultSettings.username,
      password: parsed.password ?? defaultSettings.password,
    };
  } catch (err) {
    console.warn("Failed to load DB settings", err);
    return { ...defaultSettings };
  }
}

export function saveDbSettings(settings: DbSettings) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("hpv:db-settings"));
  } catch (err) {
    console.error("Failed to save DB settings", err);
  }
}

export function isDbConfigured(settings: DbSettings) {
  return Boolean(
    settings.connectionString.trim() &&
      settings.username.trim() &&
      settings.password.trim() &&
      settings.driver.trim(),
  );
}
