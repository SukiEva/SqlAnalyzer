<script setup lang="ts">
import PlanTree from "@/components/PlanTree.vue";
import PlanTimeline from "@/components/PlanTimeline.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanNodeTooltip from "@/components/PlanNodeTooltip.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const { t } = useI18n();

const nodes = computed(() => planStore.nodes);
const insights = computed(() => planStore.insights);
const current = computed(() => planStore.currentExecution);
const tabs = computed(() => [
  { id: "sql", label: t("plan.tabs.sql") },
  { id: "plan", label: t("plan.tabs.structure") },
  { id: "timeline", label: t("plan.tabs.timeline") },
  { id: "insights", label: t("plan.tabs.insights") },
]);
const activeTab = ref("sql");

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="workspace-grid">
    <PlanNodeTooltip />
    <section class="workspace-body">
      <div class="workspace-main glass-panel">
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
          <section v-show="activeTab === 'timeline'" class="timeline-pane">
            <PlanTimeline :nodes="nodes" :total-time="current?.stats.totalTimeMs ?? 1" />
          </section>
          <section v-show="activeTab === 'insights'" class="insights-pane">
            <PlanInsightPanel :insights="insights" />
          </section>
        </div>
      </div>
    </section>
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
  padding: 1.5rem;
  gap: 1.25rem;
}

.plan-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
}

.plan-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
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

.plan-stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.plan-stat-value {
  font-size: 1.1rem;
}

.sql-block {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
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
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.tab {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.35rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.tab.active {
  border-color: var(--accent-1);
  color: var(--text-primary);
  background: rgba(75, 123, 236, 0.2);
}

.tab-panels {
  min-height: 420px;
}

.plan-pane,
.sql-pane,
.timeline-pane,
.insights-pane {
  padding: 0;
}

.plan-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-pane :deep(.plan-tree) {
  flex: 1;
  min-height: 320px;
}

.sql-pane,
.timeline-pane,
.insights-pane {
  display: flex;
  flex-direction: column;
}

.insights-pane {
  min-height: 320px;
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
}
</style>
