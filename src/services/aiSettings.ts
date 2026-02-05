export interface AiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = "hpv:ai-settings";

const defaultSettings: AiSettings = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "",
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadAiSettings(): AiSettings {
  if (!hasWindow()) return { ...defaultSettings };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      baseUrl: parsed.baseUrl ?? defaultSettings.baseUrl,
      apiKey: parsed.apiKey ?? defaultSettings.apiKey,
      model: parsed.model ?? defaultSettings.model,
    };
  } catch (err) {
    console.warn("Failed to load AI settings", err);
    return { ...defaultSettings };
  }
}

export function saveAiSettings(settings: AiSettings) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("hpv:ai-settings"));
  } catch (err) {
    console.error("Failed to save AI settings", err);
  }
}

export function isAiConfigured(settings: AiSettings) {
  return Boolean(settings.baseUrl?.trim() && settings.apiKey?.trim() && settings.model?.trim());
}
