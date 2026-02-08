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
const shortcutPlain = computed(() => t("runner.shortcutPlain"));
const shortcutAnalyze = computed(() => t("runner.shortcutAnalyze"));
const shortcutPerformance = computed(() => t("runner.shortcutPerformance"));

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

function handleKeydown(event: KeyboardEvent) {
  const hasTrigger = event.ctrlKey || event.metaKey;
  if (!hasTrigger || event.key !== "Enter") return;
  event.preventDefault();
  if (event.shiftKey) {
    run("analyze");
    return;
  }
  if (event.altKey) {
    run("performance");
    return;
  }
  run("plain");
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
          :title="`${t('runner.tipPlain')} (${shortcutPlain})`"
          :aria-label="t('runner.runPlain')"
          @click="run('plain')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 5l11 7-11 7V5Z"
              fill="currentColor"
            />
          </svg>
          <span class="runner-tooltip">{{ t("runner.runPlain") }}</span>
        </button>
        <button
          class="runner-icon-button"
          :class="{ active: runningMode === 'analyze' }"
          :disabled="!canRun || runningMode !== null"
          :title="`${t('runner.tipAnalyze')} (${shortcutAnalyze})`"
          :aria-label="t('runner.runAnalyze')"
          @click="run('analyze')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 9V7a3 3 0 0 1 6 0v2M9 9h6M9 9a3 3 0 0 0-3 3v1m12-4a3 3 0 0 1 3 3v1M8 5H6m12 0h-2M4 13h2m12 0h2M4 17h2m12 0h2M10 15v2m4-2v2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="runner-tooltip">{{ t("runner.runAnalyze") }}</span>
        </button>
        <button
          class="runner-icon-button"
          :class="{ active: runningMode === 'performance' }"
          :disabled="!canRun || runningMode !== null"
          :title="`${t('runner.tipPerformance')} (${shortcutPerformance})`"
          :aria-label="t('runner.runPerformance')"
          @click="run('performance')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 15a8 8 0 1 1 16 0M12 7v5l3 3M4 20h16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="runner-tooltip">{{ t("runner.runPerformance") }}</span>
        </button>
      </div>
    </header>

    <div v-if="!isDbConfigured(dbSettings)" class="runner-empty">
      {{ t("runner.missingConfig") }}
    </div>

    <label class="runner-field">
      <span>{{ t("runner.sqlLabel") }}</span>
      <textarea v-model="sql" rows="6" :placeholder="t('runner.sqlPlaceholder')" @keydown="handleKeydown"></textarea>
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
  position: relative;
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

.runner-icon-button:hover .runner-tooltip {
  opacity: 1;
  transform: translate(-50%, -8px);
  pointer-events: auto;
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

.runner-tooltip {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -2px);
  opacity: 0;
  pointer-events: none;
  background: var(--bg-base);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  white-space: nowrap;
  box-shadow: var(--shadow-card);
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 5;
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
