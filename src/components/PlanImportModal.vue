<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlanDialect } from "@/modules/planModel";
import { createPlanExecution } from "@/modules/planFactory";
import { usePlanStore } from "@/stores/planStore";
import { useI18n } from "vue-i18n";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const planStore = usePlanStore();
const { t } = useI18n();
const dialect = ref<PlanDialect>("opengauss");
const title = ref("");
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
      title.value = "";
      dialect.value = "opengauss";
    }
  },
);

function close() {
  emit("close");
}

async function submit() {
  if (!payload.value.trim()) {
    error.value = t("import.errors.empty");
    return;
  }
  error.value = null;
  try {
    const plan = createPlanExecution(payload.value, {
      dialectHint: dialect.value,
      title: title.value || t("import.defaultTitle"),
      source: "upload",
      sqlText: sqlText.value.trim() ? sqlText.value : undefined,
    });
    await planStore.ingestPlan(plan);
    close();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("import.errors.parse");
  }
}
</script>

<template>
  <teleport to="body">
    <div v-if="props.open" class="modal-backdrop" @click.self="close">
      <div class="modal glass-panel">
        <header>
          <h3>{{ t("import.title") }}</h3>
          <button class="ghost" @click="close">{{ t("import.actions.close") }}</button>
        </header>
        <label class="field">
          <span>{{ t("import.fields.title") }}</span>
          <input v-model="title" type="text" :placeholder="t('import.fields.title')" />
        </label>
        <label class="field">
          <span>{{ t("import.fields.dialect") }}</span>
          <select v-model="dialect">
            <option value="opengauss">openGauss</option>
            <option value="dws">Huawei DWS</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t("import.fields.sql") }}</span>
          <textarea v-model="sqlText" rows="4" :placeholder="t('import.placeholders.sql')"></textarea>
        </label>
        <label class="field">
          <span>{{ t("import.fields.plan") }}</span>
          <textarea v-model="payload" rows="10" :placeholder="t('import.placeholders.plan')"></textarea>
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="ghost" @click="close">{{ t("import.actions.cancel") }}</button>
          <button class="glow" @click="submit">{{ t("import.actions.confirm") }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 42, 68, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  width: min(680px, 90vw);
  max-height: 80vh;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow);
  overflow: auto;
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
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.65rem;
  color: var(--text-primary);
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
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
  color: #be123c;
  margin: 0;
}
</style>
