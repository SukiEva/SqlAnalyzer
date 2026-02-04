<script setup lang="ts">
import { computed } from "vue";
import { usePlanStore } from "@/stores/planStore";
import { lookupDocEntry } from "@/services/nodeDocs";

const planStore = usePlanStore();

const tooltip = computed(() => {
  const key = planStore.docTooltip.key;
  if (!key) return null;
  const entry = lookupDocEntry(key);
  if (!entry) return null;
  return {
    entry,
    x: planStore.docTooltip.x,
    y: planStore.docTooltip.y,
  };
});
</script>

<template>
  <teleport to="body">
    <div
      v-if="tooltip"
      class="node-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <h4>{{ tooltip.entry.title }}</h4>
      <p>{{ tooltip.entry.summary }}</p>
      <ul>
        <li v-for="tip in tooltip.entry.optimization" :key="tip">{{ tip }}</li>
      </ul>
      <a :href="tooltip.entry.sourceUrl" target="_blank">查看官方说明</a>
    </div>
  </teleport>
</template>

<style scoped>
.node-tooltip {
  position: absolute;
  z-index: 999;
  width: 280px;
  padding: 0.9rem;
  border-radius: 12px;
  background: rgba(5, 9, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 40px rgba(5, 9, 20, 0.6);
  color: var(--text-primary);
}

h4 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

p {
  margin: 0 0 0.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-primary);
  font-size: 0.85rem;
}

li {
  margin-bottom: 0.35rem;
}

a {
  font-size: 0.75rem;
  color: var(--accent-2);
  text-decoration: none;
}
</style>
