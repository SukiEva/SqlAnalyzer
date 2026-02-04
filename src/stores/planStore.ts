import { defineStore } from "pinia";
import type { PlanExecution, PlanNode } from "@/modules/planModel";
import { mockPlan } from "@/modules/planSamples";
import { evaluatePlan } from "@/modules/insights";
import { deleteStoredPlan, loadStoredPlans, persistPlanExecution } from "@/services/planBridge";

interface PlanState {
  currentExecution: PlanExecution | null;
  history: PlanExecution[];
  highlightedNodeId: string | null;
  focusedDocKey: string | null;
  bootstrapped: boolean;
}

export const usePlanStore = defineStore("plan", {
  state: (): PlanState => ({
    currentExecution: mockPlan,
    history: mockPlan ? [mockPlan] : [],
    highlightedNodeId: null,
    focusedDocKey: null,
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
      try {
        const stored = await loadStoredPlans();
        if (stored.length) {
          this.history = stored;
          if (!this.currentExecution) {
            this.currentExecution = stored[0];
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    },
    async ingestPlan(execution: PlanExecution, options: { persist?: boolean } = {}) {
      this.currentExecution = execution;
      const existing = this.history.filter((entry) => entry.summary.id !== execution.summary.id);
      this.history = [execution, ...existing].slice(0, 50);
      if (options.persist ?? true) {
        try {
          await persistPlanExecution(execution);
        } catch (err) {
          console.error("Failed to persist plan", err);
        }
      }
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
    async removePlan(planId: string) {
      this.history = this.history.filter((entry) => entry.summary.id !== planId);
      if (this.currentExecution?.summary.id === planId) {
        this.currentExecution = this.history[0] ?? null;
      }
      try {
        await deleteStoredPlan(planId);
      } catch (err) {
        console.error("Failed to delete stored plan", err);
      }
    },
  },
});
