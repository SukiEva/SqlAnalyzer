import { defineStore } from "pinia";
import type { PlanExecution, PlanNode, PlanSummary } from "@/modules/planModel";
import { mockPlan } from "@/modules/planSamples";
import { evaluatePlan } from "@/modules/insights";

interface PlanState {
  currentExecution: PlanExecution | null;
  history: PlanSummary[];
  highlightedNodeId: string | null;
  focusedDocKey: string | null;
}

export const usePlanStore = defineStore("plan", {
  state: (): PlanState => ({
    currentExecution: mockPlan,
    history: mockPlan ? [mockPlan.summary] : [],
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
  },
  actions: {
    setPlan(execution: PlanExecution) {
      this.currentExecution = execution;
      this.history.unshift(execution.summary);
    },
    highlightNode(nodeId: string | null) {
      this.highlightedNodeId = nodeId;
    },
    focusDoc(docKey: string | null) {
      this.focusedDocKey = docKey;
    },
  },
});
