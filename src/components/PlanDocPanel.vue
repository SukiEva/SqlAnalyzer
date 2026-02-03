<script setup lang="ts">
import { computed } from "vue";
import { usePlanStore } from "@/stores/planStore";
import { lookupDocEntry } from "@/services/nodeDocs";

const planStore = usePlanStore();

const doc = computed(() => lookupDocEntry(planStore.focusedDocKey));
</script>

<template>
  <div class="doc-panel">
    <header>
      <h3>Documentation</h3>
      <span class="tag" v-if="doc">{{ doc?.title }}</span>
    </header>
    <div v-if="doc" class="doc-body">
      <p class="summary">{{ doc.summary }}</p>
      <ul>
        <li v-for="tip in doc.optimization" :key="tip">{{ tip }}</li>
      </ul>
      <a class="doc-link" :href="doc.sourceUrl" target="_blank">View official guidance</a>
    </div>
    <p v-else class="empty">Hover a node to learn what it does.</p>
  </div>
</template>

<style scoped>
.doc-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary {
  margin: 0;
  color: var(--text-secondary);
}

ul {
  padding-left: 1.2rem;
  margin: 0.75rem 0;
  color: var(--text-primary);
}

li {
  margin-bottom: 0.4rem;
}

.doc-link {
  color: var(--accent-2);
  text-decoration: none;
  font-size: 0.85rem;
}

.empty {
  color: var(--text-secondary);
}
</style>
