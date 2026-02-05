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
    return { general: [], output: [], misc: [] } as Record<string, Array<[string, string | number | boolean]>>;
  }
  const entries = Object.entries(props.node.properties ?? {});
  const general: Array<[string, string | number | boolean]> = [];
  const output: Array<[string, string | number | boolean]> = [];
  const misc: Array<[string, string | number | boolean]> = [];
  entries.forEach(([key, value]) => {
    const lower = key.toLowerCase();
    if (["output", "filter", "rows", "width", "target", "group", "project"].some((token) => lower.includes(token))) {
      output.push([key, value]);
    } else if (["join", "scan", "index", "sort", "hash", "agg", "parallel"].some((token) => lower.includes(token))) {
      general.push([key, value]);
    } else {
      misc.push([key, value]);
    }
  });
  return { general, output, misc };
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
      <div class="tab-row" v-if="Object.keys(node.properties).length">
        <button class="tab" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">
          {{ t("plan.details.tabs.general") }}
        </button>
        <button class="tab" :class="{ active: activeTab === 'output' }" @click="activeTab = 'output'">
          {{ t("plan.details.tabs.output") }}
        </button>
        <button class="tab" :class="{ active: activeTab === 'misc' }" @click="activeTab = 'misc'">
          {{ t("plan.details.tabs.misc") }}
        </button>
      </div>
      <section class="properties" v-if="Object.keys(node.properties).length">
        <dl v-if="activeTab === 'general'">
          <template v-for="([key, value], idx) in splitProperties.general" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.general.length" class="empty">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else-if="activeTab === 'output'">
          <template v-for="([key, value], idx) in splitProperties.output" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.output.length" class="empty">{{ t("plan.details.emptyTab") }}</p>
        </dl>
        <dl v-else>
          <template v-for="([key, value], idx) in splitProperties.misc" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!splitProperties.misc.length" class="empty">{{ t("plan.details.emptyTab") }}</p>
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
  align-items: center;
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
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
  grid-template-columns: 90px 1fr;
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

.tab-row {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem;
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
