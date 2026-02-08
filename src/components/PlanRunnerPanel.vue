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
      <button class="ghost" :disabled="!canRun" @click="run('plain')">
        {{ runningMode === 'plain' ? t("runner.running") : t("runner.runPlain") }}
      </button>
      <button class="ghost" :disabled="!canRun" @click="run('analyze')">
        {{ runningMode === 'analyze' ? t("runner.running") : t("runner.runAnalyze") }}
      </button>
      <button class="ghost" :disabled="!canRun" @click="run('performance')">
        {{ runningMode === 'performance' ? t("runner.running") : t("runner.runPerformance") }}
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
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.25rem;
  background: var(--bg-panel);
  box-shadow: var(--shadow-card);
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
  background: var(--bg-soft);
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
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

.runner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.runner-empty {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-soft);
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
