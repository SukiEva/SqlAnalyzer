<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed, ref, watch } from "vue";
import { usePlanStore } from "@/stores/planStore";

defineOptions({ name: "PlanTreeNode" });

const props = defineProps({
  node: {
    type: Object as PropType<PlanNode>,
    required: true,
  },
  highlighted: {
    type: String,
    default: null,
  },
});

const store = usePlanStore();
const isCollapsed = ref(props.node.collapsed ?? props.node.children.length > 3);

watch(
  () => props.node.collapsed,
  (val) => {
    if (typeof val === "boolean") {
      isCollapsed.value = val;
    }
  },
);

const isHighlighted = computed(() => props.highlighted === props.node.id);

const ratio = computed(() => {
  if (!props.node.metrics.estimatedRows) return 1;
  return props.node.metrics.actualRows / props.node.metrics.estimatedRows;
});

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function selectNode() {
  store.highlightNode(props.node.id);
}

function handleHover(event: MouseEvent) {
  if (!props.node.docKey) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  store.showDocTooltip(props.node.docKey, {
    x: rect.left + rect.width + 12,
    y: rect.top + window.scrollY,
  });
}

function handleLeave() {
  store.hideDocTooltip();
}
</script>

<template>
  <div class="tree-node" :data-level="node.level">
    <div
      class="node-head"
      :class="{ highlighted: isHighlighted, warn: ratio > 1.5, critical: ratio > 2.5 }"
      @mouseenter="handleHover"
      @mouseleave="handleLeave"
      @click="selectNode"
    >
      <button v-if="node.children.length" class="collapse" @click.stop="toggleCollapse">
        {{ isCollapsed ? "+" : "−" }}
      </button>
      <div class="title-block">
        <p class="title">{{ node.name }}</p>
        <p class="subtitle">
          Rows {{ node.metrics.actualRows.toLocaleString() }} · Time {{ node.metrics.actualTimeMs }} ms · DN
          {{ node.metrics.dn ?? "CN" }}
        </p>
      </div>
      <span class="ratio" :class="{ bad: ratio > 1.5 }">x{{ ratio.toFixed(2) }}</span>
    </div>
    <div class="node-body" v-if="!isCollapsed">
      <div class="property-grid">
        <div v-for="(value, key) in node.properties" :key="key">
          <p class="prop-label">{{ key }}</p>
          <p class="prop-value">{{ value }}</p>
        </div>
      </div>
      <div class="children">
        <PlanTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :highlighted="highlighted"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-node {
  margin-left: calc(var(--indent, 0) + 0px);
}

.node-head {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  margin: 0.35rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
}

.node-head.highlighted {
  border-color: var(--accent-2);
  box-shadow: 0 0 12px rgba(80, 227, 194, 0.3);
}

.node-head.warn {
  border-color: var(--warn);
}

.node-head.critical {
  border-color: var(--critical);
}

.collapse {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  border-radius: 8px;
  width: 26px;
  height: 26px;
  cursor: pointer;
}

.title {
  margin: 0;
  font-weight: 600;
}

.subtitle {
  margin: 0.1rem 0 0;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.ratio {
  margin-left: auto;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
}

.ratio.bad {
  color: var(--warn);
}

.node-body {
  margin-left: 2rem;
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.prop-label {
  margin: 0;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.prop-value {
  margin: 0;
  font-family: "JetBrains Mono", monospace;
}

.children {
  border-left: 1px dashed rgba(255, 255, 255, 0.2);
  margin-left: 0.75rem;
  padding-left: 0.75rem;
}
</style>
