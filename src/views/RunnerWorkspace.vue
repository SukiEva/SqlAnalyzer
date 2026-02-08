<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import PageNav from "@/components/PageNav.vue";
import PlanImportModal from "@/components/PlanImportModal.vue";
import PlanRunnerPanel from "@/components/PlanRunnerPanel.vue";
import { usePlanStore } from "@/stores/planStore";

const planStore = usePlanStore();
const { t } = useI18n();
const current = computed(() => planStore.currentExecution);
const openImport = ref(false);

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="runner-page">
    <section class="runner-panel">
      <PageNav class="runner-nav">
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
      <div class="runner-content">
        <PlanRunnerPanel />
      </div>
    </section>
    <PlanImportModal :open="openImport" @close="openImport = false" />
  </div>
</template>

<style scoped>
.runner-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.runner-panel {
  padding: 1.75rem;
}

.runner-nav {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.runner-content {
  display: flex;
  justify-content: flex-start;
}

.runner-content :deep(.runner-panel) {
  width: min(720px, 100%);
}
</style>
