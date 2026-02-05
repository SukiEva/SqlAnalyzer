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
    <div class="insight-list scroll-y">
      <article v-for="insight in props.insights" :key="insight.id" class="insight-card">
        <span class="chip" :class="severityClass[insight.severity]">{{ insight.severity }}</span>
        <h4>{{ insight.title }}</h4>
        <p>{{ insight.details }}</p>
      </article>
      <p v-if="!props.insights.length" class="empty">{{ t("insights.empty") }}</p>
    </div>
  </div>
</template>

<style scoped>
.insight-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.insight-card {
  padding: 0.95rem;
  border-radius: 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
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
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chip-info {
  background: rgba(56, 189, 248, 0.2);
  color: #0ea5e9;
}

.chip-warn {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.chip-critical {
  background: rgba(239, 71, 111, 0.2);
  color: #be123c;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
}
</style>
