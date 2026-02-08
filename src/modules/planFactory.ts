import { v4 as uuid } from "uuid";
import type { PlanDialect, PlanExecution } from "@/modules/planModel";

export interface PlanFactoryOptions {
  dialectHint?: PlanDialect;
  title?: string;
  source?: "upload" | "connection";
  capturedAt?: string;
  sqlText?: string;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

export function createPlanExecution(planSource: string, options: PlanFactoryOptions = {}): PlanExecution {
  const normalized = planSource.trim();
  if (!normalized) {
    throw new Error("Execution plan text is empty");
  }

  const summaryId = uuid();
  const title = options.title?.trim() || "Plan import";
  const sqlText = options.sqlText?.trim() || undefined;
  const fingerprintBase = sqlText ? slugify(sqlText) : slugify(title);
  const sqlFingerprint = `${fingerprintBase || "plan"}-${summaryId.slice(0, 8)}`;

  return {
    summary: {
      id: summaryId,
      capturedAt: options.capturedAt ?? new Date().toISOString(),
      dialect: options.dialectHint ?? "opengauss",
      source: options.source ?? "upload",
      sqlFingerprint,
      title,
      sqlText,
    },
    planSource: normalized,
    planQuery: sqlText,
    nodes: [],
    stats: {
      totalTimeMs: 0,
      totalMemoryMB: 0,
      nodeCount: 0,
    },
  };
}
