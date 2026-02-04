import type { PlanExecution } from "@/modules/planModel";

const STORAGE_KEY = "hpv:plan-history";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadLocalPlans(): PlanExecution[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlanExecution[];
  } catch (err) {
    console.warn("Failed to load local plan history", err);
    return [];
  }
}

export function saveLocalPlans(plans: PlanExecution[]) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error("Failed to save local plan history", err);
  }
}

export function clearLocalPlans() {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear local plan history", err);
  }
}
