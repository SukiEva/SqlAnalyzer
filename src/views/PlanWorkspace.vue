<script setup lang="ts">
import PlanToolbar from "@/components/PlanToolbar.vue";
import PlanTree from "@/components/PlanTree.vue";
import PlanTimeline from "@/components/PlanTimeline.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import PlanDocPanel from "@/components/PlanDocPanel.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted, ref } from "vue";

const planStore = usePlanStore();

const nodes = computed(() => planStore.nodes);
const insights = computed(() => planStore.insights);
const history = computed(() => planStore.historySummaries);
const current = computed(() => planStore.currentExecution);
const tabs = [
  { id: "plan", label: "执行计划" },
  { id: "timeline", label: "时间线" },
  { id: "meta", label: "指标概览" },
];
const activeTab = ref("plan");

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="workspace-grid">
    <PlanToolbar class="toolbar" />
    <section class="workspace-body">
      <aside class="workspace-panel history glass-panel">
        <PlanHistoryPanel
          :history="history"
          @select="planStore.loadFromHistory"
          @delete="planStore.removePlan"
        />
      </aside>
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
                <span class="plan-stat-label">Nodes</span>
                <span class="plan-stat-value">{{ current.stats.nodeCount }}</span>
              </div>
              <div>
                <span class="plan-stat-label">Runtime</span>
                <span class="plan-stat-value">{{ current.stats.totalTimeMs }} ms</span>
              </div>
              <div>
                <span class="plan-stat-label">Memory</span>
                <span class="plan-stat-value">{{ current.stats.totalMemoryMB }} MB</span>
              </div>
            </div>
          </div>
          <div class="sql-block" v-if="current.summary.sqlText">
            <div class="sql-block__header">
              <p>关联 SQL</p>
              <span class="tag">上下文</span>
            </div>
            <pre class="sql-code">{{ current.summary.sqlText }}</pre>
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
          <section v-show="activeTab === 'plan'" class="plan-pane">
            <PlanTree :nodes="nodes" />
          </section>
          <section v-show="activeTab === 'timeline'" class="timeline-pane">
            <PlanTimeline :nodes="nodes" :total-time="current?.stats.totalTimeMs ?? 1" />
          </section>
          <section v-show="activeTab === 'meta'" class="meta-pane">
            <div class="meta-cards">
              <article>
                <h4>节点数量</h4>
                <p>{{ current?.stats.nodeCount ?? 0 }}</p>
              </article>
              <article>
                <h4>总耗时</h4>
                <p>{{ current?.stats.totalTimeMs ?? 0 }} ms</p>
              </article>
              <article>
                <h4>峰值内存</h4>
                <p>{{ current?.stats.totalMemoryMB ?? 0 }} MB</p>
              </article>
              <article>
                <h4>来源</h4>
                <p>{{ current?.summary.source === "upload" ? "手动导入" : "数据库连接" }}</p>
              </article>
            </div>
          </section>
        </div>
      </div>
      <aside class="workspace-panel insights glass-panel">
        <PlanInsightPanel :insights="insights" />
        <PlanDocPanel class="doc-panel" />
      </aside>
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
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 360px;
  gap: 2rem;
  min-height: 70vh;
}

.workspace-panel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.sql-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.sql-code {
  margin: 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
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
.timeline-pane,
.meta-pane {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: radial-gradient(
      circle at 15% 20%,
      rgba(80, 227, 194, 0.08),
      transparent 40%
    ),
    rgba(255, 255, 255, 0.02);
  padding: 1rem 1.25rem;
}

.timeline-pane {
  height: 100%;
}

.meta-pane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  width: 100%;
}

.meta-cards article {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
}

.meta-cards h4 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-cards p {
  margin: 0.35rem 0 0;
  font-size: 1.1rem;
  font-family: "JetBrains Mono", monospace;
}

.doc-panel {
  flex: 1;
}

@media (max-width: 1200px) {
  .workspace-body {
    grid-template-columns: minmax(0, 1fr);
  }
  .workspace-panel.history,
  .workspace-panel.insights {
    order: 2;
  }
}
</style>
