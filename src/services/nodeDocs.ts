import type { PlanDocEntry } from "@/modules/planModel";

const docs: Record<string, PlanDocEntry> = {
  aggregate: {
    key: "aggregate",
    title: "Aggregate",
    summary:
      "Combines rows using group keys; watch for large hash tables or partial aggregate opportunities in distributed coordinators.",
    optimization: [
      "Consider pushing aggregates down to DNs or using pre-aggregated materialized views",
      "Ensure grouping keys leverage distribution to avoid re-partitioning",
    ],
    sourceUrl: "https://docs.opengauss.org/en/docs/latest/docs/Developerguide/sql-aggregate.html",
  },
  hash_join: {
    key: "hash_join",
    title: "Hash Join",
    summary:
      "Builds a hash table from the smaller input and probes with the other; sensitive to work_mem sizing and skewed rows.",
    optimization: [
      "Verify join keys are selective and stats are fresh (ANALYZE)",
      "Increase work_mem or enable spill-friendly operators when hash table exceeds memory",
      "Distribute tables on common keys in DWS to reduce network shuffle",
    ],
    sourceUrl: "https://support.huaweicloud.com/devg-dws/dws_04_0401.html",
  },
  seq_scan: {
    key: "seq_scan",
    title: "Sequential Scan",
    summary: "Reads an entire table; acceptable for analytic scans but problematic for OLTP-style filters when stats mispredict.",
    optimization: [
      "Ensure predicates can use indexes or partition pruning",
      "Consider columnar storage or projections to reduce IO",
    ],
    sourceUrl: "https://docs.opengauss.org/en/docs/latest/docs/Developerguide/sql-select.html",
  },
  index_scan: {
    key: "index_scan",
    title: "Index Scan",
    summary: "Traverses a B-Tree index and fetches heap rows; random IO can dominate when many rows are returned.",
    optimization: [
      "Cover the query using index-only scans if possible",
      "Monitor heap fetch vs index hits to size buffer pools",
    ],
    sourceUrl: "https://support.huaweicloud.com/intl/en-us/devg-opengauss/",
  },
};

export function lookupDocEntry(key: string | null | undefined) {
  if (!key) return null;
  return docs[key] ?? null;
}

export function listDocs(): PlanDocEntry[] {
  return Object.values(docs);
}
