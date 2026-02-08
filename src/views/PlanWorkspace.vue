<script setup lang="ts">
import Pev2Plan from "@/components/Pev2Plan.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanImportModal from "@/components/PlanImportModal.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const { t } = useI18n();

const current = computed(() => planStore.currentExecution);
const tabs = computed(() => [
  { id: "sql", label: t("plan.tabs.sql") },
  { id: "plan", label: t("plan.tabs.structure") },
  { id: "insights", label: t("plan.tabs.insights") },
]);
const activeTab = ref("sql");
const openImport = ref(false);

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="workspace-grid">
    <section class="workspace-body">
      <div class="workspace-main glass-panel">
        <template v-if="current">
          <div class="plan-meta">
            <div class="plan-info">
              <p class="plan-title">{{ current.summary.title }}</p>
              <p class="plan-subtitle">
                {{ current.summary.dialect.toUpperCase() }} ·
                {{ new Date(current.summary.capturedAt).toLocaleString() }}
              </p>
            </div>
            <div class="plan-actions">
              <button class="ghost" @click="openImport = true">{{ t("app.importPlan") }}</button>
            </div>
          </div>
        </template>
        <div v-else class="plan-empty">
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
            <section v-if="activeTab === 'sql'" key="sql" class="sql-pane">
              <div class="sql-block">
                <pre v-if="current?.summary.sqlText || current?.planQuery" class="sql-code">
                  {{ current?.summary.sqlText || current?.planQuery }}
                </pre>
                <p v-else class="empty-state">{{ t("plan.sql.empty") }}</p>
              </div>
            </section>
            <section v-else-if="activeTab === 'plan'" key="plan" class="plan-pane">
              <Pev2Plan :execution="current" />
            </section>
            <section v-else key="insights" class="insights-pane">
              <PlanInsightPanel :execution="current" />
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

.plan-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  gap: 1.5rem;
}

.plan-info {
  flex: 1;
}

.plan-actions {
  display: flex;
  align-items: center;
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

.sql-block {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem 1.1rem;
}

.sql-code {
  margin: 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.empty-state {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
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
.sql-pane,
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
