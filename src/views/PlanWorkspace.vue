<script setup lang="ts">
import PlanTree from "@/components/PlanTree.vue";
import PlanGraph from "@/components/PlanGraph.vue";
import PlanTimeline from "@/components/PlanTimeline.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanNodeDetails from "@/components/PlanNodeDetails.vue";
import PlanImportModal from "@/components/PlanImportModal.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const { t } = useI18n();

const nodes = computed(() => planStore.nodes);
const focusedNode = computed(() => planStore.focusedNode);
const current = computed(() => planStore.currentExecution);
const tabs = computed(() => [
  { id: "sql", label: t("plan.tabs.sql") },
  { id: "plan", label: t("plan.tabs.structure") },
  { id: "canvas", label: t("plan.tabs.canvas") },
  { id: "timeline", label: t("plan.tabs.timeline") },
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
            <div class="plan-stats">
              <div>
                <span class="plan-stat-label">{{ t("plan.stats.nodes") }}</span>
                <span class="plan-stat-value">{{ current.stats.nodeCount }}</span>
              </div>
              <div>
                <span class="plan-stat-label">{{ t("plan.stats.runtime") }}</span>
                <span class="plan-stat-value">{{ current.stats.totalTimeMs }} ms</span>
              </div>
              <div>
                <span class="plan-stat-label">{{ t("plan.stats.memory") }}</span>
                <span class="plan-stat-value">{{ current.stats.totalMemoryMB }} MB</span>
              </div>
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
                <pre v-if="current?.summary.sqlText" class="sql-code">{{ current?.summary.sqlText }}</pre>
                <p v-else class="empty-state">{{ t("plan.sql.empty") }}</p>
              </div>
            </section>
            <section v-else-if="activeTab === 'plan'" key="plan" class="plan-pane">
              <PlanTree :nodes="nodes" />
            </section>
            <section v-else-if="activeTab === 'canvas'" key="canvas" class="canvas-pane">
              <div class="canvas-layout">
                <div class="canvas-stage">
                  <PlanGraph :nodes="nodes" />
                </div>
                <aside class="canvas-detail glass-panel">
                  <PlanNodeDetails :node="focusedNode" />
                </aside>
              </div>
            </section>
            <section v-else-if="activeTab === 'timeline'" key="timeline" class="timeline-pane">
              <PlanTimeline :nodes="nodes" :total-time="current?.stats.totalTimeMs ?? 1" />
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

.plan-stats {
  display: flex;
  gap: 1.5rem;
  font-family: "JetBrains Mono", monospace;
  text-align: right;
}

.plan-stats > div {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.5rem 0.75rem;
  min-width: 110px;
}

.plan-stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.plan-stat-value {
  font-size: 1.1rem;
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
.canvas-pane,
.timeline-pane,
.insights-pane {
  padding: 0;
}

.plan-pane,
.canvas-pane,
.timeline-pane,
.insights-pane {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.plan-pane :deep(.plan-tree) {
  flex: 1;
  min-height: 320px;
}

.canvas-pane {
  min-height: 520px;
}

.canvas-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 360px;
  gap: 1.5rem;
}

.canvas-stage {
  min-height: 520px;
}

.canvas-detail {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-pane :deep(.timeline) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .workspace-body {
    min-height: auto;
  }
  .canvas-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
