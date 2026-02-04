import { invoke } from "@tauri-apps/api/core";
import type { PlanDialect, PlanExecution } from "@/modules/planModel";

function hasTauriBridge() {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_IPC__);
}

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  sslMode: "disable" | "require";
  applicationName?: string;
  allowInvalidCerts?: boolean;
}

export interface ExplainOptions {
  statementTimeoutMs?: number;
  perfMode?: "normal" | "slow" | "fast";
}

export interface ExplainRequest {
  dialect: PlanDialect;
  sql: string;
  title?: string;
  connection: ConnectionConfig;
  options?: ExplainOptions;
}

export interface ExplainResponse {
  planText: string;
  dialect: PlanDialect;
  title: string;
  capturedAt: string;
}

async function invokeIfAvailable<T>(cmd: string, payload?: Record<string, unknown>): Promise<T> {
  if (!hasTauriBridge()) {
    throw new Error("Tauri APIs are unavailable outside the desktop runtime");
  }
  return (await invoke(cmd, payload)) as T;
}

export async function runExplain(request: ExplainRequest): Promise<ExplainResponse> {
  return invokeIfAvailable<ExplainResponse>("run_explain", { request });
}

export async function persistPlanExecution(plan: PlanExecution) {
  if (!hasTauriBridge()) return;
  await invoke("store_plan_execution", { plan });
}

export async function loadStoredPlans(): Promise<PlanExecution[]> {
  if (!hasTauriBridge()) return [];
  return invoke("load_plan_history");
}

export async function deleteStoredPlan(id: string) {
  if (!hasTauriBridge()) return;
  await invoke("delete_plan_history", { id });
}
