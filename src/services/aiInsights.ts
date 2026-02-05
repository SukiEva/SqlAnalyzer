import type { PlanExecution, PlanNode } from "@/modules/planModel";
import type { AiSettings } from "@/services/aiSettings";

export type AiSeverity = "info" | "warn" | "critical";

export interface AiInsightFinding {
  title: string;
  severity: AiSeverity;
  detail: string;
  evidence?: string;
}

export interface AiInsightRecommendation {
  action: string;
  rationale: string;
  impact?: string;
}

export interface AiInsightIndexHint {
  table?: string;
  columns: string[];
  reason: string;
}

export interface AiInsightSource {
  title: string;
  url: string;
  reason: string;
}

export interface AiInsightResult {
  summary: string;
  planQuality: {
    rating: "good" | "needs_attention" | "critical";
    rationale: string[];
  };
  findings: AiInsightFinding[];
  recommendations: AiInsightRecommendation[];
  indexHints: AiInsightIndexHint[];
  followUps: string[];
  sources: AiInsightSource[];
}

interface NodeDigest {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  actualRows: number;
  estimatedRows: number;
  actualTimeMs: number;
  estimatedTimeMs: number;
  memoryMB?: number;
  estimateRatio: number | null;
}

interface PlanDigest {
  dialect: string;
  sql: {
    length: number;
    preview: string | null;
    fingerprint: string;
    truncated: boolean;
  };
  stats: {
    nodeCount: number;
    totalTimeMs: number;
    totalMemoryMB: number;
    depth: number;
  };
  topNodesByTime: NodeDigest[];
  topNodesByRows: NodeDigest[];
  skewedNodes: NodeDigest[];
  nodeTypeCounts: Array<{ name: string; count: number }>;
  warnings: Array<{ nodeId: string; nodeName: string; warning: string }>;
}

const MAX_SQL_CHARS = 1400;
const MAX_NODES = 14;

function flattenNodes(nodes: PlanNode[], acc: Array<{ node: PlanNode; parentId: string | null }>, parentId: string | null) {
  nodes.forEach((node) => {
    acc.push({ node, parentId });
    if (node.children?.length) {
      flattenNodes(node.children, acc, node.id);
    }
  });
}

function computeDepth(nodes: PlanNode[], depth = 0): number {
  if (!nodes.length) return depth;
  return Math.max(...nodes.map((node) => computeDepth(node.children ?? [], depth + 1)));
}

function toDigest(entry: { node: PlanNode; parentId: string | null }): NodeDigest {
  const metrics = entry.node.metrics;
  const estimateRatio = metrics.estimatedRows ? metrics.actualRows / metrics.estimatedRows : null;
  return {
    id: entry.node.id,
    name: entry.node.name,
    level: entry.node.level,
    parentId: entry.parentId,
    actualRows: metrics.actualRows,
    estimatedRows: metrics.estimatedRows,
    actualTimeMs: metrics.actualTimeMs,
    estimatedTimeMs: metrics.estimatedTimeMs,
    memoryMB: metrics.memoryMB,
    estimateRatio,
  };
}

function compactSql(sqlText?: string) {
  if (!sqlText) {
    return { length: 0, preview: null, truncated: false };
  }
  const compact = sqlText.replace(/\s+/g, " ").trim();
  if (compact.length <= MAX_SQL_CHARS) {
    return { length: compact.length, preview: compact, truncated: false };
  }
  const head = compact.slice(0, Math.floor(MAX_SQL_CHARS * 0.65));
  const tail = compact.slice(-Math.floor(MAX_SQL_CHARS * 0.25));
  return {
    length: compact.length,
    preview: `${head} ... ${tail}`,
    truncated: true,
  };
}

function buildPlanDigest(exec: PlanExecution): PlanDigest {
  const flattened: Array<{ node: PlanNode; parentId: string | null }> = [];
  flattenNodes(exec.nodes, flattened, null);
  const digests = flattened.map(toDigest);

  const topNodesByTime = [...digests]
    .sort((a, b) => b.actualTimeMs - a.actualTimeMs)
    .slice(0, MAX_NODES);

  const topNodesByRows = [...digests]
    .sort((a, b) => b.actualRows - a.actualRows)
    .slice(0, MAX_NODES);

  const skewedNodes = digests
    .filter((node) => node.estimateRatio !== null && node.estimateRatio > 1.8)
    .sort((a, b) => (b.estimateRatio ?? 0) - (a.estimateRatio ?? 0))
    .slice(0, MAX_NODES);

  const nodeTypeCountsMap = new Map<string, number>();
  digests.forEach((node) => {
    nodeTypeCountsMap.set(node.name, (nodeTypeCountsMap.get(node.name) ?? 0) + 1);
  });

  const nodeTypeCounts = [...nodeTypeCountsMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const warnings: Array<{ nodeId: string; nodeName: string; warning: string }> = [];
  flattened.forEach(({ node }) => {
    node.warnings?.forEach((warning) => {
      warnings.push({ nodeId: node.id, nodeName: node.name, warning });
    });
  });

  const sqlInfo = compactSql(exec.summary.sqlText);

  return {
    dialect: exec.summary.dialect,
    sql: {
      length: sqlInfo.length,
      preview: sqlInfo.preview,
      fingerprint: exec.summary.sqlFingerprint,
      truncated: sqlInfo.truncated,
    },
    stats: {
      nodeCount: exec.stats.nodeCount,
      totalTimeMs: exec.stats.totalTimeMs,
      totalMemoryMB: exec.stats.totalMemoryMB,
      depth: computeDepth(exec.nodes, 0),
    },
    topNodesByTime,
    topNodesByRows,
    skewedNodes,
    nodeTypeCounts,
    warnings: warnings.slice(0, MAX_NODES),
  };
}

function buildEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function normalizeSeverity(value: string): AiSeverity {
  if (value === "critical" || value === "warn" || value === "info") return value;
  return "info";
}

function normalizeResult(payload: Partial<AiInsightResult> | null): AiInsightResult | null {
  if (!payload) return null;
  const planQuality = payload.planQuality ?? { rating: "needs_attention", rationale: [] };
  const findings = (payload.findings ?? []).map((item) => ({
    title: item.title ?? "Insight",
    severity: normalizeSeverity(item.severity ?? "info"),
    detail: item.detail ?? "",
    evidence: item.evidence,
  }));
  const recommendations = (payload.recommendations ?? []).map((item) => ({
    action: item.action ?? "",
    rationale: item.rationale ?? "",
    impact: item.impact,
  }));
  const indexHints = (payload.indexHints ?? []).map((item) => ({
    table: item.table,
    columns: Array.isArray(item.columns) ? item.columns : [],
    reason: item.reason ?? "",
  }));
  const sources = (payload.sources ?? []).map((item) => ({
    title: item.title ?? "",
    url: item.url ?? "",
    reason: item.reason ?? "",
  }));
  return {
    summary: payload.summary ?? "",
    planQuality: {
      rating:
        planQuality.rating === "good" || planQuality.rating === "critical" ? planQuality.rating : "needs_attention",
      rationale: Array.isArray(planQuality.rationale) ? planQuality.rationale : [],
    },
    findings,
    recommendations,
    indexHints,
    followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
    sources,
  };
}

function parseJsonResponse(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (err2) {
      return null;
    }
  }
}

export async function analyzePlanWithAi(
  exec: PlanExecution,
  settings: AiSettings,
  locale = "en",
): Promise<{ result: AiInsightResult | null; raw: string }> {
  const digest = buildPlanDigest(exec);
  const endpoint = buildEndpoint(settings.baseUrl);
  if (!endpoint) {
    throw new Error("Missing base URL");
  }

  const tuningDocs = {
    dws: "https://support.huaweicloud.com/devg-dws/dws_04_0401.html",
    opengauss: "https://docs.opengauss.org/zh/docs/latest/performance_tuning_guide/sql_optimization.html",
  };

  const systemMessage = [
    "You are a senior database performance analyst.",
    "Given a compact JSON digest of SQL and execution plan, produce a concise, structured analysis.",
    "Prioritize accuracy, avoid speculation, and explicitly call out assumptions.",
    "Use the database-specific performance tuning documentation when dialect matches:",
    "dws -> https://support.huaweicloud.com/devg-dws/dws_04_0401.html",
    "opengauss -> https://docs.opengauss.org/zh/docs/latest/performance_tuning_guide/sql_optimization.html",
    "If you can access the web, consult the relevant doc and reflect key guidance.",
    "If web access is unavailable, leave sources empty and add a follow-up note to review the official doc.",
    "Return ONLY valid JSON with the schema:",
    "{summary: string, planQuality: {rating: 'good'|'needs_attention'|'critical', rationale: string[]},",
    "findings: {title:string,severity:'info'|'warn'|'critical',detail:string,evidence?:string}[],",
    "recommendations: {action:string,rationale:string,impact?:string}[],",
    "indexHints: {table?:string,columns:string[],reason:string}[],",
    "followUps: string[],",
    "sources: {title:string,url:string,reason:string}[]}.",
    "Respond in Chinese when locale is 'zh', otherwise respond in English.",
  ].join(" ");

  const userMessage = JSON.stringify({
    locale,
    digest,
    tuningDocs,
    note: "Digest is intentionally compact; do not request full SQL or plan.",
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content: string =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.delta?.content ?? "";
  const parsed = parseJsonResponse(content);
  const normalized = normalizeResult(parsed);
  return {
    result: normalized,
    raw: content,
  };
}
