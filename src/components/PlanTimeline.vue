<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  nodes: {
    type: Array as PropType<PlanNode[]>,
    default: () => [],
  },
  totalTime: {
    type: Number,
    default: 1,
  },
});

const { t } = useI18n();

function flatten(nodes: PlanNode[], acc: PlanNode[] = []): PlanNode[] {
  nodes.forEach((node) => {
    acc.push(node);
    flatten(node.children, acc);
  });
  return acc;
}

const segments = computed(() => flatten(props.nodes).slice(0, 25));
const maxTime = computed(() => {
  const times = segments.value.map((s) => s.metrics.actualTimeMs);
  return times.length ? Math.max(...times) : 1;
});
</script>

<template>
  <div class="timeline">
    <div class="timeline-meta">
      <p>{{ t("plan.timeline.topNodes", { count: segments.length }) }}</p>
    </div>
    <div class="timeline-list scroll-y">
      <div v-for="segment in segments" :key="segment.id" class="timeline-row">
        <div class="label">
          <p>{{ segment.name }}</p>
          <span>{{ segment.metrics.actualTimeMs }} ms</span>
        </div>
        <div class="bar">
          <div
            class="fill"
            :style="{
              width: `${(segment.metrics.actualTimeMs / maxTime) * 100}%`,
            }"
          ></div>
        </div>
      </div>
      <p v-if="!segments.length" class="empty">{{ t("plan.timeline.empty") }}</p>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  padding: 0.5rem 0.75rem 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.timeline-meta {
  display: flex;
  justify-content: flex-end;
}

.timeline-meta p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.timeline-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-3));
}

.empty {
  color: var(--text-secondary);
  text-align: center;
}
</style>
