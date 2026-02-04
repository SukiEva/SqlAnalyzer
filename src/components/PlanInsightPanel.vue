<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanInsight } from "@/modules/planModel";
import { useI18n } from "vue-i18n";

const props = defineProps({
  insights: {
    type: Array as PropType<PlanInsight[]>,
    default: () => [],
  },
});

const { t } = useI18n();

const severityClass: Record<string, string> = {
  info: "chip-info",
  warn: "chip-warn",
  critical: "chip-critical",
};
</script>

<template>
  <div class="insight-panel">
    <header>
      <h3>{{ t("app.insights") }}</h3>
      <span class="tag">{{ props.insights.length }}</span>
    </header>
    <div class="insight-list scroll-y">
      <article v-for="insight in props.insights" :key="insight.id" class="insight-card">
        <span class="chip" :class="severityClass[insight.severity]">{{ insight.severity }}</span>
        <h4>{{ insight.title }}</h4>
        <p>{{ insight.details }}</p>
      </article>
      <p v-if="!props.insights.length" class="empty">{{ t("history.panel.empty") }}</p>
    </div>
  </div>
</template>

<style scoped>
.insight-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

header {
  display: flex;
  justify-content: space-between;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.insight-card {
  padding: 0.85rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
}

h4 {
  margin: 0.35rem 0 0.35rem;
  font-size: 1rem;
}

p {
  margin: 0;
  color: var(--text-secondary);
}

.chip {
  display: inline-flex;
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chip-info {
  background: rgba(75, 208, 255, 0.2);
  color: #4bd0ff;
}

.chip-warn {
  background: rgba(255, 200, 87, 0.2);
  color: var(--warn);
}

.chip-critical {
  background: rgba(255, 92, 141, 0.25);
  color: var(--critical);
}

.empty {
  text-align: center;
  color: var(--text-secondary);
}
</style>
