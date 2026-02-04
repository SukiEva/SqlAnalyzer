<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";
import { usePlanStore } from "@/stores/planStore";
import PlanImportModal from "@/components/PlanImportModal.vue";

const { t } = useI18n();
const planStore = usePlanStore();
const palette = ref("default");
const openImport = ref(false);

const summary = computed(() => planStore.currentExecution?.summary);

function cyclePalette() {
  const themes = ["default", "aurora", "terminal"] as const;
  const idx = themes.indexOf(palette.value as typeof themes[number]);
  palette.value = themes[(idx + 1) % themes.length];
}
</script>

<template>
  <div class="toolbar glass-panel">
    <div>
      <p class="eyebrow">Current plan</p>
      <h2 v-if="summary">{{ summary.title }}</h2>
      <p v-else>No plan loaded yet</p>
    </div>
    <div class="actions">
      <button class="ghost" @click="cyclePalette">Palette: {{ palette }}</button>
      <button class="ghost" @click="openImport = true">{{ t("app.importPlan") }}</button>
      <button class="glow" disabled title="Coming soon">
        {{ t("app.runExplain") }}
      </button>
    </div>
    <PlanImportModal :open="openImport" @close="openImport = false" />
  </div>
</template>

<style scoped>
.toolbar {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: var(--text-secondary);
}

h2 {
  margin: 0.35rem 0 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
