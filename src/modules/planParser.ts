import type { PlanDialect, PlanExecution, PlanNode } from "@/modules/planModel";
import { v4 as uuid } from "uuid";

export interface ParseOptions {
  dialectHint?: PlanDialect;
  title?: string;
  source?: "upload" | "connection";
  capturedAt?: string;
  sqlText?: string;
}

interface JsonPlanNode {
  "Node Type"?: string;
  "DN Name"?: string;
  "Actual Rows"?: number;
  "Plan Rows"?: number;
  "Actual Total Time"?: number;
  "Actual Startup Time"?: number;
  "Total Cost"?: number;
  "Plan Width"?: number;
  "Peak Memory Usage"?: string | number;
  "Memory Used"?: string | number;
  "Plans"?: JsonPlanNode[];
  [key: string]: unknown;
}

const DOC_KEY_MAP: Record<string, string> = {
  Aggregate: "aggregate",
  "Hash Aggregate": "aggregate",
  "Hash Join": "hash_join",
  "Nested Loop": "nest_loop",
  "Seq Scan": "seq_scan",
  "Index Scan": "index_scan",
  "Bitmap Heap Scan": "bitmap_heap",
  "Bitmap Index Scan": "bitmap_index",
};

export function parsePlanText(raw: string, options: ParseOptions = {}): PlanExecution {
  const text = raw.trim();
  if (!text) {
    throw new Error("Execution plan text is empty");
  }
  const dialect = options.dialectHint ?? detectDialect(text);
  if (text.startsWith("{") || text.startsWith("[")) {
    return buildExecutionFromJson(text, dialect, options, text);
  }
  if (text.includes("A-time") && text.includes("E-rows")) {
    return buildExecutionFromDwsTable(text, dialect, options, text);
  }
  return buildExecutionFromIndented(text, dialect, options, text);
}

function detectDialect(text: string): PlanDialect {
  if (/opengauss/i.test(text)) return "opengauss";
  return /dws/i.test(text) ? "dws" : "opengauss";
}

function buildExecutionFromJson(
  payload: string,
  dialect: PlanDialect,
  options: ParseOptions,
  planSource: string,
): PlanExecution {
  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch (err) {
    throw new Error("Unable to parse JSON plan");
  }
  const rootNode: JsonPlanNode | undefined = Array.isArray(parsed)
    ? parsed[0]?.Plan ?? parsed[0]
    : parsed.Plan ?? parsed;
  if (!rootNode) {
    throw new Error("JSON plan missing Plan section");
  }
  const nodes = [convertJsonNode(rootNode, 0)];
  return finalizeExecution(nodes, dialect, options, planSource);
}

function convertJsonNode(node: JsonPlanNode, level: number): PlanNode {
  const id = uuid();
  const children = (node.Plans ?? []).map((child) => convertJsonNode(child, level + 1));
  const actualRows = Number(node["Actual Rows"] ?? 0);
  const estimatedRows = Number(node["Plan Rows"] ?? 0);
  const actualTimeMs = Number(node["Actual Total Time"] ?? node["Actual Startup Time"] ?? 0) * 1;
  const estimatedTimeMs = Number(node["Total Cost"] ?? 0);
  const memoryMB = parseMemory(node["Peak Memory Usage"] ?? node["Memory Used"]);
  const nodeName = String(node["Node Type"] ?? "Operator");
  const properties: Record<string, string | number | boolean> = {};
  const propKeys = [
    "Join Type",
    "Relation Name",
    "Alias",
    "Index Name",
    "Filter",
    "Hash Cond",
    "Merge Cond",
    "Recheck Cond",
    "Group Key",
  ];
  propKeys.forEach((key) => {
    if (node[key] !== undefined) {
      properties[key] = node[key] as string | number | boolean;
    }
  });
  if (node["Plan Width"] !== undefined) {
    properties["Plan Width"] = node["Plan Width"] as number;
  }
  return {
    id,
    name: nodeName,
    level,
    children,
    metrics: {
      actualRows,
      estimatedRows,
      actualTimeMs,
      estimatedTimeMs,
      memoryMB,
      dn: typeof node["DN Name"] === "string" ? (node["DN Name"] as string) : undefined,
    },
    properties,
    docKey: DOC_KEY_MAP[nodeName] ?? nodeName.toLowerCase().replace(/\s+/g, "_"),
    warnings: actualRows > estimatedRows * 2 ? ["Actual rows exceed estimates significantly"] : undefined,
  };
}

function buildExecutionFromIndented(
  text: string,
  dialect: PlanDialect,
  options: ParseOptions,
  planSource: string,
): PlanExecution {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
  const roots: PlanNode[] = [];
  const stack: { level: number; node: PlanNode }[] = [];

  lines.forEach((line) => {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const level = Math.max(Math.floor(indent / 2), 0);
    const cleaned = line.replace(/^\s*(->)?\s*/, "");
    const [namePart, metricsPart] = cleaned.split("  (");
    const metricsText = metricsPart ? "(" + metricsPart : "";
    const metrics = extractMetrics(metricsText);
    const node: PlanNode = {
      id: uuid(),
      name: namePart.trim() || "Operator",
      level,
      metrics,
      properties: {
        raw: cleaned,
      },
      children: [],
      docKey: DOC_KEY_MAP[namePart.trim()] ?? namePart.trim().toLowerCase().replace(/\s+/g, "_"),
    };

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (!stack.length) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ level, node });
  });

  return finalizeExecution(roots, dialect, options, planSource);
}

function extractMetrics(text: string) {
  const actualRows = matchNumber(text, /rows=([0-9.]+)/i) ?? 0;
  const estimatedRows = matchNumber(text, /plan rows=([0-9.]+)/i) ?? matchNumber(text, /rows=([0-9.]+)/i) ?? 0;
  const actualTimeMs = matchNumber(text, /actual time=([0-9.]+)/i) ?? 0;
  const estimatedTimeMs = matchNumber(text, /cost=([0-9.]+)\.\./i) ?? 0;
  const memoryMB = matchNumber(text, /memory=([0-9.]+)(?:MB|M)/i) ?? undefined;
  return {
    actualRows,
    estimatedRows,
    actualTimeMs,
    estimatedTimeMs,
    memoryMB,
  };
}

function matchNumber(text: string, regex: RegExp): number | undefined {
  const match = text.match(regex);
  return match ? Number(match[1]) : undefined;
}

function parseMemory(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  const match = String(value).match(/([0-9.]+)\s*(KB|MB|GB)?/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = match[2]?.toUpperCase();
  if (unit === "GB") return amount * 1024;
  if (unit === "KB") return amount / 1024;
  return amount;
}

function buildExecutionFromDwsTable(
  text: string,
  dialect: PlanDialect,
  options: ParseOptions,
  planSource: string,
): PlanExecution {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-+]+$/.test(line));
  const headerIndex = lines.findIndex((line) => /operation/i.test(line) && /A-time/i.test(line));
  if (headerIndex === -1) {
    return buildExecutionFromIndented(text, dialect, options, planSource);
  }
  const headers = lines[headerIndex].split(/\s+\|\s+|\s{2,}/).map((h) => h.toLowerCase());
  const nodes: PlanNode[] = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const columns = lines[i].split(/\s+\|\s+|\s{2,}/);
    if (columns.length !== headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = columns[idx];
    });
    const name = row.operation ?? row["node"] ?? `Step ${i - headerIndex}`;
    const level = (row.id?.split(".").length ?? 1) - 1;
    nodes.push({
      id: uuid(),
      name,
      level,
      children: [],
      metrics: {
        actualRows: Number(row["a-rows"] ?? row["rows"] ?? 0),
        estimatedRows: Number(row["e-rows"] ?? row["rows"] ?? 0),
        actualTimeMs: parseFloat(row["a-time"] ?? "0"),
        estimatedTimeMs: parseFloat(row["e-costs"] ?? "0"),
        memoryMB: parseFloat(row["peak memory"] ?? "0"),
        dn: row["dn"] ?? row["node"],
      },
      properties: row,
      docKey: DOC_KEY_MAP[name] ?? name.toLowerCase().replace(/\s+/g, "_"),
    });
  }

  const tree = nestFlatNodes(nodes);
  return finalizeExecution(tree, dialect, options, planSource);
}

function nestFlatNodes(flat: PlanNode[]): PlanNode[] {
  const roots: PlanNode[] = [];
  const stack: PlanNode[] = [];
  flat.forEach((node) => {
    while (stack.length && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (!stack.length) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });
  return roots;
}

function finalizeExecution(
  nodes: PlanNode[],
  dialect: PlanDialect,
  options: ParseOptions,
  planSource: string,
): PlanExecution {
  const summaryId = uuid();
  let totalTime = 0;
  let totalMemory = 0;
  let nodeCount = 0;
  function walk(node: PlanNode) {
    nodeCount += 1;
    totalTime += node.metrics.actualTimeMs;
    totalMemory += node.metrics.memoryMB ?? 0;
    node.children.forEach(walk);
  }
  nodes.forEach(walk);

  const summaryTitle = options.title ?? nodes[0]?.name ?? "Imported Plan";
  return {
    summary: {
      id: summaryId,
      capturedAt: options.capturedAt ?? new Date().toISOString(),
      dialect,
      source: options.source ?? "upload",
      sqlFingerprint: `${summaryTitle}-${summaryId.slice(0, 8)}`,
      title: summaryTitle,
      tags: [],
      sqlText: options.sqlText,
    },
    planSource,
    planQuery: options.sqlText,
    nodes,
    stats: {
      totalTimeMs: Math.round(totalTime),
      totalMemoryMB: Math.round(totalMemory),
      nodeCount,
    },
    annotations: {},
  };
}
