<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import PlanTreeNode from "@/components/PlanTreeNode.vue";
import { usePlanStore } from "@/stores/planStore";
import { computed } from "vue";

const props = defineProps({
  nodes: {
    type: Array as PropType<PlanNode[]>,
    default: () => [],
  },
});

const planStore = usePlanStore();
const highlighted = computed(() => planStore.highlightedNodeId);
</script>

<template>
  <div class="plan-tree scroll-y">
    <PlanTreeNode
      v-for="node in props.nodes"
      :key="node.id"
      :node="node"
      :highlighted="highlighted"
    />
    <p v-if="!props.nodes.length" class="empty">Import a plan to begin.</p>
  </div>
</template>

<style scoped>
.plan-tree {
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
}

.empty {
  text-align: center;
  color: var(--text-secondary);
}
</style>
