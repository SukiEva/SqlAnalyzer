import type { PlanExecution, PlanInsight, PlanNode } from "@/modules/planModel";
import { v4 as uuid } from "uuid";

function collect(nodes: PlanNode[], totalTimeMs: number, acc: PlanInsight[]) {
  nodes.forEach((node) => {
    const runtimeShare = totalTimeMs ? node.metrics.actualTimeMs / totalTimeMs : 0;
    if (runtimeShare > 0.35) {
      acc.push({
        id: uuid(),
        title: `${node.name} dominates runtime`,
        severity: "critical",
        details: `${(runtimeShare * 100).toFixed(1)}% of execution time spent on ${node.name}. Investigate predicates or indexes.`,
        nodeRef: node.id,
      });
    }
    if (node.metrics.actualRows > node.metrics.estimatedRows * 2) {
      acc.push({
        id: uuid(),
        title: `${node.name} row skew`,
        severity: "warn",
        details: `Actual rows ${node.metrics.actualRows.toLocaleString()} vs estimate ${node.metrics.estimatedRows.toLocaleString()}. Refresh statistics or adjust join order.`,
        nodeRef: node.id,
      });
    }
    if (node.metrics.memoryMB && node.metrics.memoryMB > 256) {
      acc.push({
        id: uuid(),
        title: `${node.name} high memory usage`,
        severity: "warn",
        details: `${node.metrics.memoryMB} MB allocated; consider increasing work_mem or reducing hash build size.`,
        nodeRef: node.id,
      });
    }
    if (node.warnings?.length) {
      node.warnings.forEach((warning) =>
        acc.push({
          id: uuid(),
          title: warning,
          severity: "info",
          details: `${node.name}: ${warning}`,
          nodeRef: node.id,
        }),
      );
    }
    collect(node.children, totalTimeMs, acc);
  });
}

export function evaluatePlan(exec: PlanExecution | null): PlanInsight[] {
  if (!exec) return [];
  const insights: PlanInsight[] = [];
  collect(exec.nodes, exec.stats.totalTimeMs, insights);
  if (exec.stats.totalMemoryMB > 2048) {
    insights.push({
      id: uuid(),
      title: "Plan level memory pressure",
      severity: "warn",
      details: `Total memory ${exec.stats.totalMemoryMB} MB. Review operators or increase resource pool limits.`,
    });
  }
  return insights;
}
