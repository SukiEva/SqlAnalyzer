import type { PlanExecution } from "@/modules/planModel";
import { v4 as uuid } from "uuid";

const baseId = uuid();

export const mockPlan: PlanExecution = {
  summary: {
    id: baseId,
    capturedAt: new Date().toISOString(),
    dialect: "opengauss",
    source: "upload",
    sqlFingerprint: "select-orders-v1",
    title: "Order aggregation demo",
    tags: ["demo", "orders"],
  },
  stats: {
    totalTimeMs: 1234,
    totalMemoryMB: 205,
    nodeCount: 6,
  },
  nodes: [
    {
      id: `${baseId}-root`,
      name: "Aggregate",
      level: 0,
      metrics: {
        actualRows: 120,
        estimatedRows: 100,
        actualTimeMs: 750,
        estimatedTimeMs: 600,
        memoryMB: 48,
        dn: "CN",
      },
      description: "Finalize aggregation before returning rows",
      properties: {
        strategy: "Hashed",
      },
      docKey: "aggregate",
      children: [
        {
          id: `${baseId}-hashjoin`,
          name: "Hash Join",
          level: 1,
          metrics: {
            actualRows: 5400,
            estimatedRows: 2400,
            actualTimeMs: 640,
            estimatedTimeMs: 400,
            memoryMB: 96,
            dn: "DN1",
          },
          properties: {
            joinType: "Inner",
          },
          warnings: ["Actual rows exceed estimate by 2.2x"],
          docKey: "hash_join",
          children: [
            {
              id: `${baseId}-scan1`,
              name: "Seq Scan on orders",
              level: 2,
              metrics: {
                actualRows: 10000,
                estimatedRows: 10000,
                actualTimeMs: 380,
                estimatedTimeMs: 370,
                memoryMB: 32,
                dn: "DN1",
              },
              properties: {
                filter: "status = 'completed'",
              },
              docKey: "seq_scan",
              children: [],
            },
            {
              id: `${baseId}-scan2`,
              name: "Index Scan on customers_pkey",
              level: 2,
              metrics: {
                actualRows: 120,
                estimatedRows: 120,
                actualTimeMs: 80,
                estimatedTimeMs: 60,
                memoryMB: 6,
                dn: "DN2",
              },
              properties: {
                index: "customers_pkey",
              },
              docKey: "index_scan",
              children: [],
            },
          ],
        },
      ],
    },
  ],
  annotations: {
    [`${baseId}-root`]: ["Check aggregation pushdown possibilities"],
  },
};
