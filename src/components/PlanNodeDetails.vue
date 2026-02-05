<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { lookupDocEntry } from "@/services/nodeDocs";

const props = defineProps({
  node: {
    type: Object as PropType<PlanNode | null>,
    default: null,
  },
});

const { t } = useI18n();

const docEntry = computed(() => {
  if (!props.node?.docKey) return null;
  return lookupDocEntry(props.node.docKey);
});

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
</script>

<template>
  <div class="node-details">
    <p class="eyebrow">{{ t("plan.details.title") }}</p>
    <template v-if="node">
      <h3>{{ node.name }}</h3>
      <p class="subtitle" v-if="docEntry">{{ docEntry.summary }}</p>
      <div class="metrics">
        <div v-for="item in metrics" :key="item.label" class="metric">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <section class="properties" v-if="Object.keys(node.properties).length">
        <h4>{{ t("plan.details.attributes") }}</h4>
        <dl>
          <template v-for="(value, key) in node.properties" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </section>
      <section class="warnings" v-if="node.warnings?.length">
        <h4>{{ t("plan.details.warnings") }}</h4>
        <ul>
          <li v-for="warning in node.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>
      <a
        v-if="docEntry"
        class="doc-link"
        :href="docEntry.sourceUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ t("plan.details.docLink") }}
      </a>
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

.properties h4,
.warnings h4 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
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

.doc-link {
  text-decoration: none;
  font-size: 0.8rem;
  color: var(--accent-1);
}

.empty {
  padding: 2rem 0.5rem;
  text-align: center;
  color: var(--text-secondary);
}
</style>
