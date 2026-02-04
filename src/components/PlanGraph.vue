<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanNode } from "@/modules/planModel";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { hierarchy, tree } from "d3-hierarchy";
import { usePlanStore } from "@/stores/planStore";
import { useI18n } from "vue-i18n";

interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  node: PlanNode;
  runtimeRatio: number;
}

interface LayoutResult {
  nodes: LayoutNode[];
  links: { source: LayoutNode; target: LayoutNode }[];
  width: number;
  height: number;
  maxRuntime: number;
}

const props = defineProps({
  nodes: {
    type: Array as PropType<PlanNode[]>,
    default: () => [],
  },
});

const planStore = usePlanStore();
const { t } = useI18n();

const stageRef = ref<HTMLDivElement | null>(null);
const transform = ref({ x: 40, y: 40, scale: 1 });
const dragging = ref(false);
const dragOrigin = ref({ x: 0, y: 0 });
const transformOrigin = ref({ x: 0, y: 0 });

const layout = computed<LayoutResult>(() => {
  if (!props.nodes.length) {
    return { nodes: [], links: [], width: 640, height: 420, maxRuntime: 1 };
  }

  const pseudoRoot: PlanNode = {
    id: "graph-root",
    name: "Plan Root",
    level: 0,
    metrics: {
      actualRows: 0,
      estimatedRows: 0,
      actualTimeMs: 0,
      estimatedTimeMs: 0,
    },
    properties: {},
    children: props.nodes,
  };

  const root = hierarchy(pseudoRoot, (node) => node.children ?? []);
  const layoutTree = tree<PlanNode>().nodeSize([120, 260]);
  layoutTree(root);

  const descendants = root.descendants().filter((node) => node.depth > 0);
  const minX = Math.min(...descendants.map((node) => node.x));
  const maxX = Math.max(...descendants.map((node) => node.x));
  const maxY = Math.max(...descendants.map((node) => node.y));

  const normalizedNodes: LayoutNode[] = descendants.map((node) => ({
    id: node.data.id,
    name: node.data.name,
    node: node.data,
    x: node.x - minX + 50,
    y: node.y + 140,
    runtimeRatio: 0,
  }));

  const maxRuntime = Math.max(
    ...normalizedNodes.map((node) => node.node.metrics.actualTimeMs || 1),
    1,
  );

  normalizedNodes.forEach((node) => {
    node.runtimeRatio = (node.node.metrics.actualTimeMs || 0) / maxRuntime;
  });

  const nodeLookup = new Map<string, LayoutNode>();
  normalizedNodes.forEach((node) => nodeLookup.set(node.id, node));

  const links = root
    .links()
    .map((link) => {
      const source = nodeLookup.get(link.source.data.id);
      const target = nodeLookup.get(link.target.data.id);
      if (!source || !target) return null;
      return { source, target };
    })
    .filter((entry): entry is { source: LayoutNode; target: LayoutNode } => Boolean(entry));

  return {
    nodes: normalizedNodes,
    links,
    width: maxY + 420,
    height: maxX - minX + 260,
    maxRuntime,
  };
});

const canvasStyle = computed(() => ({
  width: `${layout.value.width}px`,
  height: `${layout.value.height}px`,
}));

const contentStyle = computed(() => ({
  transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
  transformOrigin: "0 0",
}));

watch(
  () => props.nodes.map((node) => node.id).join(","),
  () => resetView(),
);

function resetView() {
  transform.value = { x: 40, y: 40, scale: 1 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function runtimeColor(ratio: number) {
  const startHue = 210;
  const endHue = 12;
  const hue = startHue + (endHue - startHue) * ratio;
  const lightness = 60 - ratio * 18;
  return `hsl(${hue}, 75%, ${lightness}%)`;
}

function linkPath(link: { source: LayoutNode; target: LayoutNode }) {
  const startX = link.source.y;
  const startY = link.source.x;
  const endX = link.target.y;
  const endY = link.target.x;
  const midX = (startX + endX) / 2;
  return `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
}

function handleHover(node: LayoutNode, event: MouseEvent) {
  planStore.highlightNode(node.id);
  if (!node.node.docKey) return;
  planStore.showDocTooltip(node.node.docKey, {
    x: event.clientX + 16,
    y: event.clientY + window.scrollY - 10,
  });
}

function handleLeave() {
  planStore.highlightNode(null);
  planStore.scheduleDocTooltipHide();
}

function handleWheel(event: WheelEvent) {
  if (!layout.value.nodes.length) return;
  event.preventDefault();
  const rect = stageRef.value?.getBoundingClientRect();
  if (!rect) return;
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const scaleDelta = event.deltaY > 0 ? 0.9 : 1.1;
  const nextScale = clamp(transform.value.scale * scaleDelta, 0.5, 2.4);
  const originX = (pointerX - transform.value.x) / transform.value.scale;
  const originY = (pointerY - transform.value.y) / transform.value.scale;
  transform.value = {
    scale: nextScale,
    x: pointerX - originX * nextScale,
    y: pointerY - originY * nextScale,
  };
}

function startDrag(event: PointerEvent) {
  if (!layout.value.nodes.length || event.button !== 0) return;
  dragging.value = true;
  dragOrigin.value = { x: event.clientX, y: event.clientY };
  transformOrigin.value = { ...transform.value };
  window.addEventListener("pointermove", onDrag);
  window.addEventListener("pointerup", endDrag);
}

function onDrag(event: PointerEvent) {
  if (!dragging.value) return;
  const dx = event.clientX - dragOrigin.value.x;
  const dy = event.clientY - dragOrigin.value.y;
  transform.value = {
    ...transform.value,
    x: transformOrigin.value.x + dx,
    y: transformOrigin.value.y + dy,
  };
}

function endDrag() {
  dragging.value = false;
  window.removeEventListener("pointermove", onDrag);
  window.removeEventListener("pointerup", endDrag);
}

onBeforeUnmount(() => {
  endDrag();
});
</script>

<template>
  <div class="plan-graph">
    <div class="graph-stage" ref="stageRef" @wheel.prevent="handleWheel" @pointerdown="startDrag">
      <div v-if="layout.nodes.length" class="graph-content" :style="contentStyle">
        <svg class="graph-canvas" :style="canvasStyle" :viewBox="`0 0 ${layout.width} ${layout.height}`">
          <g class="links">
            <path
              v-for="(link, index) in layout.links"
              :key="index"
              class="link-path"
              :d="linkPath(link)"
              :style="{ stroke: runtimeColor(link.target.runtimeRatio) }"
            />
          </g>
          <g class="nodes">
            <g
              v-for="node in layout.nodes"
              :key="node.id"
              class="node"
              :transform="`translate(${node.y - 120}, ${node.x - 45})`"
              @mouseenter="handleHover(node, $event as MouseEvent)"
              @mouseleave="handleLeave"
            >
              <rect :fill="runtimeColor(node.runtimeRatio)" />
              <text class="label">{{ node.name }}</text>
              <text class="meta">
                {{ node.node.metrics.actualTimeMs }} ms · {{ t("plan.node.rows") }}
                {{ node.node.metrics.actualRows.toLocaleString() }}
              </text>
            </g>
          </g>
        </svg>
      </div>
      <p v-else class="empty">{{ t("plan.graph.empty") }}</p>
    </div>
    <div class="graph-footer">
      <div class="legend">
        <span>{{ t("plan.graph.slow") }}</span>
        <div class="bar"></div>
        <span>{{ t("plan.graph.hot") }}</span>
      </div>
      <p class="hint">
        {{ t("plan.graph.hint") }}
        <button class="ghost" @click="resetView">{{ t("plan.graph.reset") }}</button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.plan-graph {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.graph-stage {
  position: relative;
  flex: 1;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(1, 8, 22, 0.85);
  cursor: grab;
}

.graph-stage:active {
  cursor: grabbing;
}

.graph-content {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.links .link-path {
  fill: none;
  stroke-width: 3;
  opacity: 0.45;
  filter: drop-shadow(0 8px 16px rgba(5, 9, 20, 0.45));
}

.nodes .node {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.nodes .node:hover {
  transform: scale(1.02) translate(0, 0);
}

rect {
  width: 240px;
  height: 90px;
  rx: 18px;
  ry: 18px;
  fill: rgba(75, 123, 236, 0.2);
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1px;
  filter: drop-shadow(0 25px 40px rgba(5, 9, 20, 0.65));
}

.nodes .node:hover rect {
  stroke: rgba(255, 255, 255, 0.65);
}

text {
  pointer-events: none;
}

.label {
  font-size: 1rem;
  font-weight: 600;
  fill: var(--text-primary);
  transform: translate(20px, 36px);
}

.meta {
  font-size: 0.78rem;
  fill: var(--text-secondary);
  transform: translate(20px, 60px);
}

.empty {
  margin: 0;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.graph-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend span {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.legend .bar {
  width: 150px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4b7bec, #50e3c2, #f5a524, #ff5c8d);
}

.hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.hint .ghost {
  padding: 0.15rem 0.8rem;
}
</style>
