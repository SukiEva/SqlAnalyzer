<script setup lang="ts">
import PlanHistoryPanel from "@/components/PlanHistoryPanel.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const planStore = usePlanStore();
const history = computed(() => planStore.historySummaries);
const { t } = useI18n();

onMounted(() => {
  planStore.bootstrap();
});
</script>

<template>
  <div class="history-page">
    <section class="history-hero glass-panel">
      <div>
        <p class="eyebrow">{{ t("history.hero.eyebrow") }}</p>
        <h1>{{ t("history.hero.title") }}</h1>
        <p class="subtitle">{{ t("history.hero.subtitle") }}</p>
      </div>
      <div class="stats">
        <div>
          <span>{{ t("history.hero.total") }}</span>
          <strong>{{ history.length }}</strong>
        </div>
        <div>
          <span>{{ t("history.hero.latest") }}</span>
          <strong>{{ history[0]?.title ?? t("history.hero.none") }}</strong>
        </div>
      </div>
    </section>
    <section class="history-panel glass-panel">
      <PlanHistoryPanel
        :history="history"
        @select="planStore.loadFromHistory"
        @delete="planStore.removePlan"
      />
    </section>
  </div>
</template>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-hero {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255, 139, 77, 0.08));
  border: 1px solid var(--border);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  margin: 0;
  color: var(--text-muted);
}

h1 {
  margin: 0.5rem 0;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  gap: 1.5rem;
}

.stats span {
  display: block;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.stats strong {
  font-size: 1.2rem;
}

.history-panel {
  padding: 1.25rem;
}
</style>
