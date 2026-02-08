<script setup lang="ts">
import { computed } from "vue";
import type { PlanExecution } from "@/modules/planModel";
import { Plan as Pev2Plan } from "../../vendor/pev2/src/components";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  execution: PlanExecution | null;
  activeTab?: "plan" | "grid" | "raw";
}>();
const { t } = useI18n();

const planSource = computed(() => props.execution?.planSource ?? "");
const planQuery = computed(() => props.execution?.planQuery ?? props.execution?.summary.sqlText ?? "");
const hasPlan = computed(() => Boolean(planSource.value.trim()));
const targetTab = computed(() => props.activeTab ?? "plan");
</script>

<template>
  <div v-if="execution && hasPlan" class="pev2-wrapper">
    <Pev2Plan
      :plan-source="planSource"
      :plan-query="planQuery"
      :active-tab="targetTab"
      :disable-hash="true"
      :hide-tabs="true"
    />
  </div>
  <div v-else class="pev2-empty">
    <p>{{ t("plan.emptyState") }}</p>
  </div>
</template>

<style scoped>
.pev2-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 560px;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  --bs-body-bg: var(--bg-panel);
  --bs-body-color: var(--text-primary);
  --bs-border-color: var(--border);
  --bs-tertiary-bg: var(--bg-soft);
  --bs-secondary-color: var(--text-secondary);
  --bs-secondary-bg: var(--bg-muted);
}

.pev2-wrapper :deep(.context-pane) {
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
}

.pev2-wrapper :deep(.context-title) {
  background: var(--bg-soft);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.pev2-wrapper :deep(.context-body) {
  background: var(--bg-panel);
}


.pev2-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--text-secondary);
}
</style>
