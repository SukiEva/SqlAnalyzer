<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import PlanImportModal from "@/components/PlanImportModal.vue";
import PlanRunnerPanel from "@/components/PlanRunnerPanel.vue";
import PageNav from "@/components/PageNav.vue";
import { usePlanStore } from "@/stores/planStore";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const planStore = usePlanStore();
const history = computed(() => planStore.historySummaries);
const current = computed(() => planStore.currentExecution);
const { t } = useI18n();
const router = useRouter();
const openImport = ref(false);

function handleSelect(planId: string) {
  planStore.loadFromHistory(planId);
  router.push("/");
}

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="history-page">
    <section class="history-panel">
      <PageNav class="history-nav">
        <template #left>
          <span v-if="!current" class="brand-title">{{ t("app.title") }}</span>
          <div v-else class="plan-heading">
            <p class="plan-heading-title">{{ current.summary.title }}</p>
            <p class="plan-heading-subtitle">
              {{ current.summary.dialect.toUpperCase() }} ·
              {{ new Date(current.summary.capturedAt).toLocaleString() }}
            </p>
          </div>
        </template>
        <template #actions>
          <button class="ghost" @click="openImport = true">{{ t("app.importPlan") }}</button>
        </template>
      </PageNav>
      <div class="history-content">
        <PlanHistoryPanel
          :history="history"
          @select="handleSelect"
          @delete="planStore.removePlan"
        />
        <PlanRunnerPanel />
      </div>
    </section>
    <PlanImportModal :open="openImport" @close="openImport = false" />
  </div>
</template>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.history-panel {
  padding: 1.75rem;
}

.history-nav {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.history-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1100px) {
  .history-content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
