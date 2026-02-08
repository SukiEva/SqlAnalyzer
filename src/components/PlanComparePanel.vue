<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, watch } from "vue";
import type { PlanExecution } from "@/modules/planModel";
import { useI18n } from "vue-i18n";

const props = defineProps({
  execution: {
    type: Object as PropType<PlanExecution | null>,
    default: null,
  },
});

const { t } = useI18n();
const candidate = ref("");

watch(
  () => props.execution?.summary.id,
  () => {
    candidate.value = "";
  },
);

const basePlan = computed(() => props.execution?.planSource ?? "");
const hasBase = computed(() => Boolean(basePlan.value.trim()));
const hasCandidate = computed(() => Boolean(candidate.value.trim()));

interface DiffEntry {
  type: "equal" | "add" | "remove";
  left?: string;
  right?: string;
}

interface DiffRow {
  type: DiffEntry["type"];
  left?: string;
  right?: string;
  leftNo?: number;
  rightNo?: number;
  leftClass: string;
  rightClass: string;
}

function buildDiff(oldLines: string[], newLines: string[]): DiffEntry[] {
  const a = oldLines;
  const b = newLines;
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffEntry[] = [];
  let i = n;
  let j = m;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.push({ type: "equal", left: a[i - 1], right: b[j - 1] });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.push({ type: "remove", left: a[i - 1] });
      i -= 1;
    } else {
      result.push({ type: "add", right: b[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    result.push({ type: "remove", left: a[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    result.push({ type: "add", right: b[j - 1] });
    j -= 1;
  }

  return result.reverse();
}

const diffRows = computed<DiffRow[]>(() => {
  if (!hasBase.value || !hasCandidate.value) return [];
  const leftLines = basePlan.value.split(/\r?\n/);
  const rightLines = candidate.value.split(/\r?\n/);
  const diff = buildDiff(leftLines, rightLines);
  const rows: DiffRow[] = [];
  let leftNo = 1;
  let rightNo = 1;

  diff.forEach((entry) => {
    const row: DiffRow = {
      type: entry.type,
      left: entry.left,
      right: entry.right,
      leftClass: "",
      rightClass: "",
    };

    if (entry.type === "add") {
      row.rightNo = rightNo;
      rightNo += 1;
      row.rightClass = "diff-add";
      row.leftClass = "diff-empty";
    } else if (entry.type === "remove") {
      row.leftNo = leftNo;
      leftNo += 1;
      row.leftClass = "diff-remove";
      row.rightClass = "diff-empty";
    } else {
      row.leftNo = leftNo;
      row.rightNo = rightNo;
      leftNo += 1;
      rightNo += 1;
    }

    rows.push(row);
  });

  return rows;
});
</script>

<template>
  <div class="compare-panel">
    <header class="compare-header">
      <div>
        <h3>{{ t("compare.title") }}</h3>
        <p class="subtitle">{{ t("compare.hint") }}</p>
      </div>
    </header>

    <label class="compare-field">
      <span>{{ t("compare.newPlanLabel") }}</span>
      <textarea v-model="candidate" rows="6" :placeholder="t('compare.placeholder')"></textarea>
    </label>

    <p v-if="!execution" class="compare-empty">{{ t("compare.emptyOld") }}</p>
    <p v-else-if="!hasCandidate" class="compare-empty">{{ t("compare.emptyNew") }}</p>

    <div v-else class="compare-table">
      <div class="compare-row compare-head">
        <div class="compare-cell">
          <span class="cell-title">{{ t("compare.oldPlanLabel") }}</span>
        </div>
        <div class="compare-cell">
          <span class="cell-title">{{ t("compare.newPlanLabel") }}</span>
        </div>
      </div>
      <div v-for="(row, index) in diffRows" :key="index" class="compare-row">
        <div class="compare-cell" :class="row.leftClass">
          <span class="line-number">{{ row.leftNo ?? "" }}</span>
          <span class="line-text">{{ row.left ?? "" }}</span>
        </div>
        <div class="compare-cell" :class="row.rightClass">
          <span class="line-number">{{ row.rightNo ?? "" }}</span>
          <span class="line-text">{{ row.right ?? "" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.compare-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.compare-field textarea {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

.compare-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 0;
}

.compare-table {
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
}

.compare-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  border-bottom: 1px solid var(--border);
}

.compare-row:last-child {
  border-bottom: none;
}

.compare-cell {
  display: flex;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-right: 1px solid var(--border);
  align-items: flex-start;
  min-height: 40px;
}

.compare-cell:last-child {
  border-right: none;
}

.compare-head {
  background: var(--bg-soft);
  font-weight: 600;
  color: var(--text-secondary);
}

.cell-title {
  font-size: 0.85rem;
}

.line-number {
  width: 2.5rem;
  flex-shrink: 0;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.line-text {
  white-space: pre-wrap;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.diff-add {
  background: rgba(34, 197, 94, 0.12);
}

.diff-remove {
  background: rgba(239, 71, 111, 0.12);
}

.diff-empty {
  background: var(--bg-soft);
  color: var(--text-muted);
}
</style>
