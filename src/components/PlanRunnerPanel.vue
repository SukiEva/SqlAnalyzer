<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { loadDbSettings, isDbConfigured } from "@/services/dbSettings";
import { createPlanExecution } from "@/modules/planFactory";
import { usePlanStore } from "@/stores/planStore";
import { useRouter } from "vue-router";

type RunMode = "plain" | "analyze" | "performance";

interface RunResponse {
  planSource: string;
  format: string;
}

const { t } = useI18n();
const planStore = usePlanStore();
const router = useRouter();

const sql = ref("");
const runningMode = ref<RunMode | null>(null);
const error = ref<string | null>(null);
const dbSettings = ref(loadDbSettings());

const canRun = computed(() => isDbConfigured(dbSettings.value) && Boolean(sql.value.trim()));

function refreshSettings() {
  dbSettings.value = loadDbSettings();
}

onMounted(() => {
  window.addEventListener("hpv:db-settings", refreshSettings);
});

onBeforeUnmount(() => {
  window.removeEventListener("hpv:db-settings", refreshSettings);
});

function modeLabel(mode: RunMode) {
  switch (mode) {
    case "analyze":
      return t("runner.modeAnalyze");
    case "performance":
      return t("runner.modePerformance");
    default:
      return t("runner.modePlain");
  }
}

async function run(mode: RunMode) {
  if (!canRun.value || runningMode.value) return;
  error.value = null;
  runningMode.value = mode;
  try {
    const response = await invoke<RunResponse>("run_explain", {
      payload: {
        driver: dbSettings.value.driver,
        connectionString: dbSettings.value.connectionString,
        username: dbSettings.value.username,
        password: dbSettings.value.password,
        sql: sql.value,
        mode,
      },
    });
    const plan = createPlanExecution(response.planSource, {
      dialectHint: dbSettings.value.driver,
      title: t("runner.planTitle", { mode: modeLabel(mode) }),
      source: "connection",
      sqlText: sql.value,
    });
    await planStore.ingestPlan(plan, { persist: true });
    const shouldJump = window.confirm(t("runner.jumpPrompt"));
    if (shouldJump) {
      router.push("/");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("runner.error");
  } finally {
    runningMode.value = null;
  }
}
</script>

<template>
  <div class="runner-panel">
    <header class="runner-header">
      <div>
        <h3>{{ t("runner.title") }}</h3>
        <p class="subtitle">{{ t("runner.subtitle") }}</p>
      </div>
      <span class="runner-tag">Runner</span>
    </header>

    <div v-if="!isDbConfigured(dbSettings)" class="runner-empty">
      {{ t("runner.missingConfig") }}
    </div>

    <label class="runner-field">
      <span>{{ t("runner.sqlLabel") }}</span>
      <textarea v-model="sql" rows="6" :placeholder="t('runner.sqlPlaceholder')"></textarea>
    </label>

    <div class="runner-actions">
      <button
        class="runner-action"
        :disabled="!canRun"
        :title="t('runner.tipPlain')"
        @click="run('plain')"
      >
        <span class="action-title">{{ t("runner.runPlain") }}</span>
        <span class="action-desc">{{ t("runner.tipPlain") }}</span>
      </button>
      <button
        class="runner-action"
        :disabled="!canRun"
        :title="t('runner.tipAnalyze')"
        @click="run('analyze')"
      >
        <span class="action-title">{{ t("runner.runAnalyze") }}</span>
        <span class="action-desc">{{ t("runner.tipAnalyze") }}</span>
      </button>
      <button
        class="runner-action"
        :disabled="!canRun"
        :title="t('runner.tipPerformance')"
        @click="run('performance')"
      >
        <span class="action-title">{{ t("runner.runPerformance") }}</span>
        <span class="action-desc">{{ t("runner.tipPerformance") }}</span>
      </button>
    </div>

    <p v-if="error" class="runner-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.runner-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.runner-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.runner-tag {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 600;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.runner-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.runner-field textarea {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

.runner-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.runner-action {
  border: 1px solid var(--border);
  background: var(--bg-base);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.runner-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.runner-action:hover:not(:disabled) {
  border-color: var(--accent-1);
  box-shadow: var(--shadow-card);
  transform: translateY(-1px);
}

.action-title {
  font-weight: 600;
  color: var(--text-primary);
}

.action-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.runner-empty {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-base);
  border: 1px dashed var(--border);
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.runner-error {
  margin: 0;
  color: var(--critical);
  font-size: 0.85rem;
}
</style>
