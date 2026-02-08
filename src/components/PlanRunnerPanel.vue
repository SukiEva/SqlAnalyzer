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
      <div class="runner-heading">
        <h3>{{ t("runner.title") }}</h3>
        <p class="subtitle">{{ t("runner.subtitle") }}</p>
      </div>
      <div class="runner-toolbar">
        <button
          class="runner-icon-button"
          :class="{ active: runningMode === 'plain' }"
          :disabled="!canRun || runningMode !== null"
          :title="t('runner.tipPlain')"
          :aria-label="t('runner.runPlain')"
          @click="run('plain')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 5.5h10.5a3.5 3.5 0 0 1 0 7H4m0 0 3-3m-3 3 3 3M14 19h6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          class="runner-icon-button"
          :class="{ active: runningMode === 'analyze' }"
          :disabled="!canRun || runningMode !== null"
          :title="t('runner.tipAnalyze')"
          :aria-label="t('runner.runAnalyze')"
          @click="run('analyze')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 19V5m0 14h14m0 0-3-3m3 3-3 3M9 15l3-4 3 2 4-6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          class="runner-icon-button"
          :class="{ active: runningMode === 'performance' }"
          :disabled="!canRun || runningMode !== null"
          :title="t('runner.tipPerformance')"
          :aria-label="t('runner.runPerformance')"
          @click="run('performance')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 4v4m0 0a4 4 0 1 1-3.46 6m3.46-6 4-4m-8.5 15H20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>

    <div v-if="!isDbConfigured(dbSettings)" class="runner-empty">
      {{ t("runner.missingConfig") }}
    </div>

    <label class="runner-field">
      <span>{{ t("runner.sqlLabel") }}</span>
      <textarea v-model="sql" rows="6" :placeholder="t('runner.sqlPlaceholder')"></textarea>
    </label>

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
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.runner-toolbar {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.runner-icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, color 0.2s ease;
}

.runner-icon-button svg {
  width: 18px;
  height: 18px;
}

.runner-icon-button:hover:not(:disabled) {
  border-color: var(--accent-1);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
  transform: translateY(-1px);
}

.runner-icon-button.active {
  border-color: var(--accent-1);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.runner-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
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
