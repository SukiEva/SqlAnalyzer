<script setup lang="ts">
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted } from "vue";

const planStore = usePlanStore();
const history = computed(() => planStore.historySummaries);

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="history-page">
    <section class="history-hero glass-panel">
      <div>
        <p class="eyebrow">History</p>
        <h1>执行计划历史</h1>
        <p class="subtitle">集中查看、检索并管理最近导入的执行计划。</p>
      </div>
      <div class="stats">
        <div>
          <span>总条目</span>
          <strong>{{ history.length }}</strong>
        </div>
        <div>
          <span>最近更新</span>
          <strong>{{ history[0]?.title ?? "暂无" }}</strong>
        </div>
      </div>
    </section>
    <section class="history-panel glass-panel">
      <PlanHistoryPanel
        :history="history"
        @select="planStore.loadFromHistory"
        @delete="planStore.removePlan"
      />
    </section>
  </div>
</template>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-hero {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  margin: 0;
  color: var(--text-secondary);
}

h1 {
  margin: 0.5rem 0;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  gap: 1.5rem;
}

.stats span {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.stats strong {
  font-size: 1.2rem;
}

.history-panel {
  padding: 1.25rem;
}
</style>
