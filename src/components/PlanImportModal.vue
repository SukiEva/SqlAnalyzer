<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlanDialect } from "@/modules/planModel";
import { parsePlanText } from "@/modules/planParser";
import { usePlanStore } from "@/stores/planStore";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const planStore = usePlanStore();
const dialect = ref<PlanDialect>("opengauss");
const title = ref("Manual import");
const sqlText = ref("");
const payload = ref("");
const error = ref<string | null>(null);

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      payload.value = "";
      error.value = null;
      sqlText.value = "";
    }
  },
);

function close() {
  emit("close");
}

async function submit() {
  try {
    const plan = parsePlanText(payload.value, {
      dialectHint: dialect.value,
      title: title.value,
      source: "upload",
      sqlText: sqlText.value.trim() ? sqlText.value : undefined,
    });
    await planStore.ingestPlan(plan);
    close();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to parse plan";
  }
}
</script>

<template>
  <teleport to="body">
    <div v-if="props.open" class="modal-backdrop" @click.self="close">
      <div class="modal glass-panel">
        <header>
          <h3>Import Execution Plan</h3>
          <button class="ghost" @click="close">Close</button>
        </header>
        <label class="field">
          <span>Title</span>
          <input v-model="title" type="text" />
        </label>
        <label class="field">
          <span>SQL (可选)</span>
          <textarea v-model="sqlText" rows="4" placeholder="粘贴原始 SQL，便于历史分析"></textarea>
        </label>
        <label class="field">
          <span>Dialect</span>
          <select v-model="dialect">
            <option value="opengauss">openGauss</option>
            <option value="dws">Huawei DWS</option>
          </select>
        </label>
        <label class="field">
          <span>Plan Text / JSON</span>
          <textarea v-model="payload" rows="10" placeholder="Paste EXPLAIN PERFORMANCE output here..."></textarea>
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="ghost" @click="close">Cancel</button>
          <button class="glow" @click="submit">Import</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 9, 20, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  width: min(720px, 90vw);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

input,
select,
textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem;
  color: var(--text-primary);
  font-family: inherit;
}

textarea {
  font-family: "JetBrains Mono", monospace;
}

.actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.error {
  color: var(--critical);
  margin: 0;
}
</style>
