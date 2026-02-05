import type { AiInsightResult } from "@/services/aiInsights";

export interface StoredInsight {
  planId: string;
  updatedAt: string;
  result: AiInsightResult;
  raw?: string;
}

const STORAGE_KEY = "hpv:ai-insights";
const MAX_ENTRIES = 30;

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadAll(): Record<string, StoredInsight> {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredInsight>;
  } catch (err) {
    console.warn("Failed to load AI insight cache", err);
    return {};
  }
}

function saveAll(payload: Record<string, StoredInsight>) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save AI insight cache", err);
  }
}

export function loadInsight(planId: string): StoredInsight | null {
  const all = loadAll();
  return all[planId] ?? null;
}

export function saveInsight(planId: string, data: StoredInsight) {
  const all = loadAll();
  all[planId] = data;
  const entries = Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const trimmed = entries.slice(0, MAX_ENTRIES);
  const normalized: Record<string, StoredInsight> = {};
  trimmed.forEach((entry) => {
    normalized[entry.planId] = entry;
  });
  saveAll(normalized);
}

export function clearInsight(planId: string) {
  const all = loadAll();
  if (all[planId]) {
    delete all[planId];
    saveAll(all);
  }
}
