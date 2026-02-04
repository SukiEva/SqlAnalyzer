<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed } from "vue";
import { hierarchy, tree } from "d3-hierarchy";
import { usePlanStore } from "@/stores/planStore";
import { useI18n } from "vue-i18n";

interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  depth: number;
  node: PlanNode;
}

const props = defineProps({
  nodes: {
    type: Array as PropType<PlanNode[]>,
    default: () => [],
  },
});

const planStore = usePlanStore();
const { t } = useI18n();

const layout = computed(() => {
  if (!props.nodes.length) {
    return { nodes: [] as LayoutNode[], links: [] as { source: LayoutNode; target: LayoutNode }[], width: 600, height: 320 };
  }

  const pseudoRoot: PlanNode = {
    id: "pseudo-root",
    name: "Plan",
    level: 0,
    metrics: { actualRows: 0, estimatedRows: 0, actualTimeMs: 0, estimatedTimeMs: 0 },
    properties: {},
    children: props.nodes,
  };

  const root = hierarchy(pseudoRoot, (node) => node.children ?? []);
  const treeLayout = tree<typeof root.data>().nodeSize([140, 240]);
  treeLayout(root);

  const positioned = root.descendants().map((node) => ({
    id: node.data.id,
    name: node.data.name,
    depth: node.depth,
    x: node.x,
    y: node.y,
    node: node.data,
  }));

  const actualNodes = positioned.filter((node) => node.depth > 0);
  const minX = Math.min(...actualNodes.map((node) => node.x));
  const maxX = Math.max(...actualNodes.map((node) => node.x));
  const maxY = Math.max(...actualNodes.map((node) => node.y));

  const paddedNodes = positioned.map((node) => ({
    ...node,
    x: node.x - minX + 60,
    y: node.y + 80,
  }));

  const nodes = paddedNodes
    .filter((node) => node.depth > 0)
    .map((node) => ({
      id: node.id,
      name: node.name,
      depth: node.depth - 1,
      x: node.x,
      y: node.y,
      node: node.node,
    }));

  const nodeMap = new Map<string, LayoutNode | (LayoutNode & { depth: number })>();
  paddedNodes.forEach((node) => {
    nodeMap.set(node.id, node as LayoutNode);
  });

  const links = root
    .links()
    .map((link) => {
      const source = nodeMap.get(link.source.data.id);
      const target = nodeMap.get(link.target.data.id);
      if (!source || !target || target.depth === 0) return null;
      return {
        source,
        target,
      };
    })
    .filter((entry): entry is { source: LayoutNode; target: LayoutNode } => Boolean(entry));

  const width = maxY + 320;
  const height = maxX - minX + 200;

  const maxRuntime = Math.max(...nodes.map((node) => node.node.metrics.actualTimeMs || 1), 1);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      runtimeRatio: (node.node.metrics.actualTimeMs || 0) / maxRuntime,
    })),
    links,
    width,
    height: Math.max(height, 360),
  };
});

function linkPath(link: { source: LayoutNode; target: LayoutNode }) {
  const startX = link.source.y;
  const startY = link.source.x;
  const endX = link.target.y;
  const endY = link.target.x;
  const midX = (startX + endX) / 2;
  return `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
}

function nodeFill(ratio: number) {
  const hue = 210 - ratio * 160;
  return `hsl(${hue}, 70%, ${55 - ratio * 10}%)`;
}

function handleEnter(node: LayoutNode, event: MouseEvent) {
  planStore.highlightNode(node.id);
  if (node.node.docKey) {
    planStore.showDocTooltip(node.node.docKey, {
      x: event.clientX + 18,
      y: event.clientY + window.scrollY - 12,
    });
  }
}

function handleLeave() {
  planStore.highlightNode(null);
  planStore.scheduleDocTooltipHide();
}

function selectNode(node: LayoutNode) {
  planStore.highlightNode(node.id);
}
</script>

<template>
  <div class="plan-graph">
    <svg
      v-if="layout.nodes.length"
      class="graph-canvas"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      preserveAspectRatio="xMinYMin meet"
    >
      <g class="links">
        <path v-for="(link, index) in layout.links" :key="index" :d="linkPath(link)" />
      </g>
      <g class="nodes">
        <g
          v-for="node in layout.nodes"
          :key="node.id"
          class="node"
          :transform="`translate(${node.y}, ${node.x})`"
          @mouseenter="handleEnter(node, $event)"
          @mouseleave="handleLeave"
          @click="selectNode(node)"
        >
          <rect :fill="nodeFill(node.runtimeRatio)" />
          <text class="label">{{ node.name }}</text>
          <text class="meta">
            {{ node.node.metrics.actualTimeMs }} ms · {{ t("plan.node.rows") }}
            {{ node.node.metrics.actualRows.toLocaleString() }}
          </text>
        </g>
      </g>
    </svg>
    <p v-else class="empty">{{ t("plan.graph.empty") }}</p>
  </div>
</template>

<style scoped>
.plan-graph {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  padding: 0.5rem;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.links path {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 2;
}

.nodes .node {
  cursor: pointer;
}

rect {
  width: 210px;
  height: 60px;
  rx: 14px;
  ry: 14px;
  filter: drop-shadow(0 12px 20px rgba(5, 9, 20, 0.45));
}

.nodes .node:hover rect {
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 1.5px;
}

text {
  pointer-events: none;
}

.label {
  font-size: 0.95rem;
  font-weight: 600;
  fill: var(--text-primary);
  transform: translate(16px, 24px);
}

.meta {
  font-size: 0.75rem;
  fill: rgba(255, 255, 255, 0.7);
  transform: translate(16px, 44px);
}

.empty {
  margin: auto;
  color: var(--text-secondary);
}
</style>
