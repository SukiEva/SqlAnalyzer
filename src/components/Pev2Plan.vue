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
}


.pev2-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--text-secondary);
}
</style>
