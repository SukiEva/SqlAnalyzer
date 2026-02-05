<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  node: {
    type: Object as PropType<PlanNode | null>,
    default: null,
  },
});

const { t } = useI18n();

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

const propertyEntries = computed(() =>
  props.node ? Object.entries(props.node.properties ?? {}) : [],
);
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
      <section class="properties" v-if="Object.keys(node.properties ?? {}).length">
        <dl>
          <template v-for="([key, value], idx) in propertyEntries" :key="`${key}-${idx}`">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <p v-if="!propertyEntries.length" class="empty-tab">{{ t("plan.details.emptyTab") }}</p>
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
</style>
