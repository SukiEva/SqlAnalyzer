<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  node: {
    type: Object as PropType<PlanNode | null>,
    default: null,
  },
});

const { t } = useI18n();

const activeTab = ref("general");

const tabOptions = computed(() => [
  { id: "general", label: t("plan.details.tabs.general") },
  { id: "io", label: t("plan.details.tabs.io") },
  { id: "buffers", label: t("plan.details.tabs.buffers") },
  { id: "output", label: t("plan.details.tabs.output") },
  { id: "workers", label: t("plan.details.tabs.workers") },
  { id: "misc", label: t("plan.details.tabs.misc") },
]);

const metrics = computed(() => {
  if (!props.node) return [];
  return [
    { label: t("plan.stats.runtime"), value: `${props.node.metrics.actualTimeMs} ms` },
    { label: t("plan.stats.nodes"), value: props.node.metrics.actualRows.toLocaleString() },
    {
      label: t("plan.stats.memory"),
      value: props.node.metrics.memoryMB ? `${props.node.metrics.memoryMB} MB` : t("plan.details.unknown"),
    },
    { label: t("plan.node.dn"), value: props.node.metrics.dn ?? "CN" },
  ];
});

const estimateRatio = computed(() => {
  if (!props.node?.metrics.estimatedRows) return null;
  return props.node.metrics.actualRows / props.node.metrics.estimatedRows;
});

const splitProperties = computed(() => {
  if (!props.node) {
    return {
      general: [],
      io: [],
      buffers: [],
      output: [],
      workers: [],
      misc: [],
    } as Record<string, Array<[string, string | number | boolean]>>;
  }
  const entries = Object.entries(props.node.properties ?? {});
  const general: Array<[string, string | number | boolean]> = [];
  const io: Array<[string, string | number | boolean]> = [];
  const buffers: Array<[string, string | number | boolean]> = [];
  const output: Array<[string, string | number | boolean]> = [];
  const workers: Array<[string, string | number | boolean]> = [];
  const misc: Array<[string, string | number | boolean]> = [];
  const outputTokens = [
    "output",
    "target",
    "group key",
    "sort key",
    "hash key",
    "merge key",
    "distinct",
    "projection",
    "order by",
    "partition by",
  ];
  const ioTokens = [
    "i/o",
    "io",
    "read time",
    "write time",
    "io time",
    "disk",
  ];
  const bufferTokens = [
    "buffer",
    "block",
    "hit",
    "dirtied",
    "written",
    "read",
    "temp",
    "shared",
    "local",
    "cache",
    "reused",
  ];
  const workerTokens = ["worker", "parallel", "launch", "planned", "launched", "leader", "gather"];
  const generalTokens = [
    "parent",
    "relationship",
    "join",
    "scan",
    "index",
    "strategy",
    "relation",
    "schema",
    "alias",
    "startup",
    "total",
    "cost",
    "rows",
    "width",
    "loops",
    "time",
    "condition",
    "filter",
    "recheck",
    "heap",
    "hash",
    "sort",
    "group",
    "aggregate",
    "strategy",
    "type",
  ];
  entries.forEach(([key, value]) => {
    const lower = key.toLowerCase();
    if (outputTokens.some((token) => lower.includes(token))) {
      output.push([key, value]);
      return;
    }
    const ioMatch =
      ioTokens.some((token) => lower.includes(token)) &&
      (lower.includes("time") || lower.includes("i/o") || lower.includes("io"));
    if (ioMatch || (lower.includes("time") && (lower.includes("read") || lower.includes("write")))) {
      io.push([key, value]);
      return;
    }
    if (bufferTokens.some((token) => lower.includes(token))) {
      buffers.push([key, value]);
      return;
    }
    if (workerTokens.some((token) => lower.includes(token))) {
      workers.push([key, value]);
      return;
    }
    if (generalTokens.some((token) => lower.includes(token))) {
      general.push([key, value]);
      return;
    }
    misc.push([key, value]);
  });
  return { general, io, buffers, output, workers, misc };
});
</script>

<template>
  <div class="node-details">
    <p class="eyebrow">{{ t("plan.details.title") }}</p>
    <template v-if="node">
      <div class="node-header">
        <div>
          <h3>{{ node.name }}</h3>
          <p class="subtitle">{{ t("plan.details.nodeId") }} #{{ node.id }}</p>
        </div>
        <div class="ratio-pill" v-if="estimateRatio">
          <span>{{ t("plan.details.estimateRatio") }}</span>
          <strong>x{{ estimateRatio.toFixed(2) }}</strong>
        </div>
      </div>
      <div class="metrics">
        <div v-for="item in metrics" :key="item.label" class="metric">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="tab-row" v-if="Object.keys(node.properties ?? {}).length">
        <button
          v-for="tab in tabOptions"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <section class="properties" v-if="Object.keys(node.properties ?? {}).length">
        <dl v-if="activeTab === 'general'">
          <template v-for="([key, value], idx) in splitProperties.general" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.general.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else-if="activeTab === 'io'">
          <template v-for="([key, value], idx) in splitProperties.io" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.io.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else-if="activeTab === 'buffers'">
          <template v-for="([key, value], idx) in splitProperties.buffers" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.buffers.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else-if="activeTab === 'output'">
          <template v-for="([key, value], idx) in splitProperties.output" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.output.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else-if="activeTab === 'workers'">
          <template v-for="([key, value], idx) in splitProperties.workers" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.workers.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else>
          <template v-for="([key, value], idx) in splitProperties.misc" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.misc.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
        </dl>
      </section>
      <section class="warnings" v-if="node.warnings?.length">
        <h4>{{ t("plan.details.warnings") }}</h4>
        <ul>
          <li v-for="warning in node.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>
    </template>
    <template v-else>
      <div class="empty">
        <p>{{ t("plan.details.empty") }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.node-details {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.node-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.65rem;
  color: var(--text-muted);
}

h3 {
  margin: 0;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.ratio-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 10px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.65rem;
  background: var(--bg-soft);
}

.metric span {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.metric strong {
  font-family: "JetBrains Mono", monospace;
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr;
  gap: 0.4rem 0.6rem;
}

dt {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

dd {
  margin: 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.warnings ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #b45309;
  font-size: 0.85rem;
}

.empty {
  padding: 2rem 0.5rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-tab {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.properties {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.8rem 0.9rem;
  background: var(--bg-panel);
}

.tab-row {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem;
  flex-wrap: wrap;
}

.tab-row .tab {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
}

.tab-row .tab.active {
  background: var(--bg-panel);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}
</style>
