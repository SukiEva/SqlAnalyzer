<script setup lang="ts">
import PlanTree from "@/components/PlanTree.vue";
import PlanGraph from "@/components/PlanGraph.vue";
import PlanTimeline from "@/components/PlanTimeline.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanNodeTooltip from "@/components/PlanNodeTooltip.vue";
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
    <PlanNodeTooltip />
    <section class="workspace-body">
      <div class="workspace-main glass-panel">
        <div class="workspace-toolbar">
          <div>
            <p class="workspace-title">{{ t("app.workspace") }}</p>
            <p class="workspace-subtitle">
              <template v-if="current">
                {{ t("plan.meta.sourceLabel") }} ·
                {{
                  current.summary.source === "connection"
                    ? t("plan.meta.sourceConnection")
                    : t("plan.meta.sourceUpload")
                }}
              </template>
              <template v-else>{{ t("plan.emptyState") }}</template>
            </p>
          </div>
          <button class="glow" @click="openImport = true">{{ t("app.importPlan") }}</button>
        </div>
        <template v-if="current">
          <div class="plan-meta">
            <div>
              <p class="plan-title">{{ current.summary.title }}</p>
              <p class="plan-subtitle">
                {{ current.summary.dialect.toUpperCase() }} ·
                {{ new Date(current.summary.capturedAt).toLocaleString() }}
              </p>
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
          <section v-show="activeTab === 'sql'" class="sql-pane">
            <div class="sql-block">
              <pre v-if="current?.summary.sqlText" class="sql-code">{{ current?.summary.sqlText }}</pre>
              <p v-else class="empty-state">{{ t("plan.sql.empty") }}</p>
            </div>
          </section>
          <section v-show="activeTab === 'plan'" class="plan-pane">
            <PlanTree :nodes="nodes" />
          </section>
          <section v-show="activeTab === 'canvas'" class="canvas-pane">
            <div class="canvas-layout">
              <div class="canvas-stage">
                <PlanGraph :nodes="nodes" />
              </div>
              <aside class="canvas-detail glass-panel">
                <PlanNodeDetails :node="focusedNode" />
              </aside>
            </div>
          </section>
          <section v-show="activeTab === 'timeline'" class="timeline-pane">
            <PlanTimeline :nodes="nodes" :total-time="current?.stats.totalTimeMs ?? 1" />
          </section>
          <section v-show="activeTab === 'insights'" class="insights-pane">
            <PlanInsightPanel :execution="current" />
          </section>
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

.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 0.85rem 1.1rem;
}

.workspace-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.workspace-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.plan-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  gap: 1.5rem;
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
