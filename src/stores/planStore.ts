import { defineStore } from "pinia";
import type { PlanExecution, PlanNode } from "@/modules/planModel";
import { mockPlan } from "@/modules/planSamples";
import { evaluatePlan } from "@/modules/insights";

interface PlanState {
  currentExecution: PlanExecution | null;
  history: PlanExecution[];
  highlightedNodeId: string | null;
  focusedDocKey: string | null;
}

export const usePlanStore = defineStore("plan", {
  state: (): PlanState => ({
    currentExecution: mockPlan,
    history: mockPlan ? [mockPlan] : [],
    highlightedNodeId: null,
    focusedDocKey: null,
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
    setPlan(execution: PlanExecution) {
      this.currentExecution = execution;
      const existing = this.history.filter((entry) => entry.summary.id !== execution.summary.id);
      this.history = [execution, ...existing].slice(0, 20);
    },
    highlightNode(nodeId: string | null) {
      this.highlightedNodeId = nodeId;
    },
    focusDoc(docKey: string | null) {
      this.focusedDocKey = docKey;
    },
    loadFromHistory(planId: string) {
      const found = this.history.find((entry) => entry.summary.id === planId);
      if (found) {
        this.currentExecution = found;
      }
    },
  },
});
