<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanSummary } from "@/modules/planModel";

const props = defineProps({
  history: {
    type: Array as PropType<PlanSummary[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

function select(id: string) {
  emit("select", id);
}
</script>

<template>
  <div class="history-panel">
    <header>
      <h3>History</h3>
      <span class="tag">{{ props.history.length }} stored</span>
    </header>
    <div class="history-list scroll-y">
      <article
        v-for="entry in props.history"
        :key="entry.id"
        class="history-card"
        @click="select(entry.id)"
      >
        <p class="history-title">{{ entry.title }}</p>
        <p class="history-meta">
          {{ entry.dialect.toUpperCase() }} ·
          {{ new Date(entry.capturedAt).toLocaleString() }}
        </p>
      </article>
      <p v-if="!props.history.length" class="empty">No entries yet</p>
    </div>
  </div>
</template>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-list {
  margin-top: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.history-card:hover {
  border-color: var(--accent-1);
}

.history-title {
  margin: 0;
  font-size: 0.95rem;
}

.history-meta {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  color: var(--text-secondary);
}
</style>
