<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanSummary } from "@/modules/planModel";
import { useI18n } from "vue-i18n";

const props = defineProps({
  history: {
    type: Array as PropType<PlanSummary[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "delete", id: string): void;
}>();

const { t } = useI18n();

function select(id: string) {
  emit("select", id);
}

function remove(id: string) {
  emit("delete", id);
}
</script>

<template>
  <div class="history-panel">
    <header>
      <h3>{{ t("history.panel.title") }}</h3>
      <span class="tag">
        {{
          t("history.panel.count", {
            count: props.history.length,
          })
        }}
      </span>
    </header>
    <div class="history-list scroll-y">
      <article v-for="entry in props.history" :key="entry.id" class="history-card" @click="select(entry.id)">
        <div class="card-head">
          <p class="history-title">{{ entry.title }}</p>
          <button class="delete" :title="t('history.actions.remove')" @click.stop="remove(entry.id)">✕</button>
        </div>
        <p class="history-meta">
          {{ entry.dialect.toUpperCase() }} ·
          {{ new Date(entry.capturedAt).toLocaleString() }}
        </p>
        <p v-if="entry.sqlText" class="history-sql">
          {{ entry.sqlText.slice(0, 60) }}<span v-if="entry.sqlText.length > 60">…</span>
        </p>
        <p class="tags" v-if="entry.tags?.length">
          <span v-for="tag in entry.tags" :key="tag" class="tag">{{ tag }}</span>
        </p>
      </article>
      <p v-if="!props.history.length" class="empty">{{ t("history.panel.empty") }}</p>
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
  margin-top: 1.35rem;
  padding-top: 0.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.history-card {
  padding: 0.85rem;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg-panel);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-card:hover {
  border-color: var(--accent-1);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.history-title {
  margin: 0;
  font-size: 0.95rem;
}

.delete {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}

.tags {
  margin: 0.35rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.history-meta {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.history-sql {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: "JetBrains Mono", monospace;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
}
</style>
