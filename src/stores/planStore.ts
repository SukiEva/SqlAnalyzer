import { defineStore } from "pinia";
import type { PlanExecution, PlanNode } from "@/modules/planModel";
import { mockPlan } from "@/modules/planSamples";
import { evaluatePlan } from "@/modules/insights";
import { loadLocalPlans, saveLocalPlans } from "@/services/historyStorage";

interface PlanState {
  currentExecution: PlanExecution | null;
  history: PlanExecution[];
  highlightedNodeId: string | null;
  docTooltip: {
    key: string | null;
    x: number;
    y: number;
  };
  bootstrapped: boolean;
}

export const usePlanStore = defineStore("plan", {
  state: (): PlanState => ({
    currentExecution: mockPlan,
    history: mockPlan ? [mockPlan] : [],
    highlightedNodeId: null,
    docTooltip: { key: null, x: 0, y: 0 },
    bootstrapped: false,
  }),
  getters: {
    nodes(state): PlanNode[] {
      return state.currentExecution?.nodes ?? [];
    },
    insights(state) {
      if (!state.currentExecution) return [];
      return evaluatePlan(state.currentExecution);
    },
    historySummaries(state) {
      return state.history.map((entry) => entry.summary);
    },
  },
  actions: {
    async bootstrap() {
      if (this.bootstrapped) return;
      this.bootstrapped = true;
      const stored = loadLocalPlans();
      if (stored.length) {
        this.history = stored;
        if (!this.currentExecution) {
          this.currentExecution = stored[0];
        }
      }
    },
    async ingestPlan(execution: PlanExecution, _options: { persist?: boolean } = {}) {
      this.currentExecution = execution;
      const existing = this.history.filter((entry) => entry.summary.id !== execution.summary.id);
      this.history = [execution, ...existing].slice(0, 50);
      saveLocalPlans(this.history);
    },
    highlightNode(nodeId: string | null) {
      this.highlightedNodeId = nodeId;
    },
    loadFromHistory(planId: string) {
      const found = this.history.find((entry) => entry.summary.id === planId);
      if (found) {
        this.currentExecution = found;
      }
    },
    async removePlan(planId: string) {
      this.history = this.history.filter((entry) => entry.summary.id !== planId);
      if (this.currentExecution?.summary.id === planId) {
        this.currentExecution = this.history[0] ?? null;
      }
      saveLocalPlans(this.history);
    },
    showDocTooltip(docKey: string | null, coords?: { x: number; y: number }) {
      if (!docKey || !coords) {
        this.docTooltip = { key: null, x: 0, y: 0 };
        return;
      }
      this.docTooltip = {
        key: docKey,
        x: coords.x,
        y: coords.y,
      };
    },
    hideDocTooltip() {
      this.docTooltip = { key: null, x: 0, y: 0 };
    },
  },
});
