import type { AiInsightResult } from "@/services/aiInsights";

export interface StoredInsight {
  planId: string;
  updatedAt: string;
  result: AiInsightResult;
  raw?: string;
  id?: string;
}

const STORAGE_KEY = "hpv:ai-insights";
const MAX_PLANS = 30;
const MAX_HISTORY_PER_PLAN = 10;

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeEntry(planId: string, entry: StoredInsight): StoredInsight | null {
  if (!entry?.result) return null;
  const updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString();
  return {
    planId: entry.planId ?? planId,
    updatedAt,
    result: entry.result,
    raw: entry.raw,
    id: entry.id ?? `${planId}-${updatedAt}`,
  };
}

function loadAll(): Record<string, StoredInsight[]> {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredInsight | StoredInsight[]>;
    const normalized: Record<string, StoredInsight[]> = {};
    Object.entries(parsed).forEach(([planId, value]) => {
      if (Array.isArray(value)) {
        const entries = value
          .map((entry) => normalizeEntry(planId, entry))
          .filter((entry): entry is StoredInsight => Boolean(entry))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (entries.length) {
          normalized[planId] = entries;
        }
        return;
      }
      if (value && typeof value === "object") {
        const entry = normalizeEntry(planId, value as StoredInsight);
        if (entry) {
          normalized[planId] = [entry];
        }
      }
    });
    return normalized;
  } catch (err) {
    console.warn("Failed to load AI insight cache", err);
    return {};
  }
}

function saveAll(payload: Record<string, StoredInsight[]>) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save AI insight cache", err);
  }
}

export function loadInsight(planId: string): StoredInsight | null {
  const all = loadAll();
  return all[planId]?.[0] ?? null;
}

export function loadInsightHistory(planId: string): StoredInsight[] {
  const all = loadAll();
  return all[planId] ?? [];
}

export function saveInsight(planId: string, data: StoredInsight) {
  const all = loadAll();
  const entry = normalizeEntry(planId, data);
  if (!entry) return;
  const existing = all[planId] ?? [];
  const merged = [entry, ...existing];
  const deduped: StoredInsight[] = [];
  const seen = new Set<string>();
  merged.forEach((item) => {
    const key = item.id ?? `${item.planId}-${item.updatedAt}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({ ...item, id: key });
  });
  all[planId] = deduped.slice(0, MAX_HISTORY_PER_PLAN);

  const planEntries = Object.entries(all).sort((a, b) => {
    const aDate = a[1]?.[0]?.updatedAt ?? "";
    const bDate = b[1]?.[0]?.updatedAt ?? "";
    return bDate.localeCompare(aDate);
  });
  const trimmedPlans = planEntries.slice(0, MAX_PLANS);
  const normalized: Record<string, StoredInsight[]> = {};
  trimmedPlans.forEach(([id, entries]) => {
    normalized[id] = entries;
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
