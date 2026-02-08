<script setup lang="ts">
import Pev2Plan from "@/components/Pev2Plan.vue";
import PageNav from "@/components/PageNav.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanImportModal from "@/components/PlanImportModal.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const { t } = useI18n();

const current = computed(() => planStore.currentExecution);
const tabs = computed(() => [
  { id: "context", label: t("plan.tabs.sql") },
  { id: "visual", label: t("plan.tabs.structure") },
  { id: "execution", label: t("plan.tabs.canvas") },
  { id: "insights", label: t("plan.tabs.insights") },
]);
const activeTab = ref("visual");
const pev2Tab = computed(() => {
  switch (activeTab.value) {
    case "context":
      return "raw";
    case "execution":
      return "grid";
    default:
      return "plan";
  }
});
const openImport = ref(false);

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="workspace-grid">
    <section class="workspace-body">
      <div class="workspace-main">
        <PageNav class="workspace-nav">
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
        <div v-if="!current" class="plan-empty">
          <div>
            <p class="plan-title">{{ t("app.workspace") }}</p>
            <p class="plan-subtitle">{{ t("plan.emptyState") }}</p>
          </div>
          <button class="glow" @click="openImport = true">{{ t("app.importPlan") }}</button>
        </div>
        <div class="tab-strip">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="tab-panels">
          <Transition name="tab-fade" mode="out-in">
            <section v-if="activeTab === 'insights'" key="insights" class="insights-pane">
              <PlanInsightPanel :execution="current" />
            </section>
            <section v-else key="plan" class="plan-pane">
              <Pev2Plan :execution="current" :active-tab="pev2Tab" :key="current ? current.summary.id : 'empty'" />
            </section>
          </Transition>
        </div>
      </div>
    </section>
    <PlanImportModal :open="openImport" @close="openImport = false" />
  </div>
</template>

<style scoped>
.workspace-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.workspace-body {
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.workspace-main {
  display: flex;
  flex-direction: column;
  padding: 1.75rem;
  gap: 1.5rem;
}

.workspace-nav {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.plan-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.plan-subtitle {
  margin: 0;
  color: var(--text-secondary);
}

.plan-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.1rem 1.2rem;
  border-radius: 18px;
  border: 1px dashed var(--border);
  background: var(--bg-soft);
}

.plan-empty .plan-title {
  font-size: 1.05rem;
}

.plan-empty .plan-subtitle {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.tab-strip {
  display: inline-flex;
  gap: 0.35rem;
  margin-top: 0.25rem;
  padding: 0.35rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
}

.tab {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.35rem 1.1rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 600;
  transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.tab.active {
  border-color: transparent;
  color: var(--text-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-card);
}

.tab:active {
  transform: translateY(1px) scale(0.98);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.plan-pane,
.insights-pane {
  padding: 0;
}

.plan-pane,
.insights-pane {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

@media (max-width: 1200px) {
  .workspace-body {
    min-height: auto;
  }
}
</style>
