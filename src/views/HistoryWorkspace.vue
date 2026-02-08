<script setup lang="ts">
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import PageNav from "@/components/PageNav.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const history = computed(() => planStore.historySummaries);
const { t } = useI18n();

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="history-page">
    <section class="history-panel glass-panel">
      <PageNav class="history-nav" />
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
  gap: 0;
}

.history-panel {
  padding: 1.25rem;
}

.history-nav {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}
</style>
