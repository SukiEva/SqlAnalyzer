<script setup lang="ts">
import PlanToolbar from "@/components/PlanToolbar.vue";
import PlanTree from "@/components/PlanTree.vue";
import PlanTimeline from "@/components/PlanTimeline.vue";
import PlanInsightPanel from "@/components/PlanInsightPanel.vue";
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import PlanDocPanel from "@/components/PlanDocPanel.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted } from "vue";

const planStore = usePlanStore();

const nodes = computed(() => planStore.nodes);
const insights = computed(() => planStore.insights);
const history = computed(() => planStore.historySummaries);
const current = computed(() => planStore.currentExecution);

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
        <div class="plan-meta" v-if="current">
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
        <div class="plan-views">
          <PlanTree :nodes="nodes" />
          <PlanTimeline :nodes="nodes" :total-time="current?.stats.totalTimeMs ?? 1" />
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
  gap: 1.5rem;
}

.workspace-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  gap: 1.5rem;
  min-height: 70vh;
}

.workspace-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workspace-main {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  gap: 1rem;
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

.plan-views {
  display: grid;
  grid-template-rows: minmax(420px, 1fr) 160px;
  gap: 1rem;
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
