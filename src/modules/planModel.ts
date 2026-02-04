export type PlanDialect = "dws" | "opengauss";

export interface PlanMetric {
  actualRows: number;
  estimatedRows: number;
  actualTimeMs: number;
  estimatedTimeMs: number;
  memoryMB?: number;
  dn?: string;
}

export interface PlanNode {
  id: string;
  name: string;
  description?: string;
  level: number;
  children: PlanNode[];
  metrics: PlanMetric;
  properties: Record<string, string | number | boolean>;
  warnings?: string[];
  docKey?: string;
  collapsed?: boolean;
}

export interface PlanSummary {
  id: string;
  capturedAt: string;
  dialect: PlanDialect;
  source: "upload" | "connection";
  sqlFingerprint: string;
  title: string;
  tags?: string[];
  sqlText?: string;
}

export interface PlanExecution {
  summary: PlanSummary;
  nodes: PlanNode[];
  stats: {
    totalTimeMs: number;
    totalMemoryMB: number;
    nodeCount: number;
  };
  annotations?: Record<string, string[]>;
}

export interface PlanInsight {
  id: string;
  title: string;
  severity: "info" | "warn" | "critical";
  details: string;
  nodeRef?: string;
}

export interface PlanDocEntry {
  key: string;
  title: string;
  summary: string;
  optimization: string[];
  sourceUrl: string;
}
