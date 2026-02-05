<script setup lang="ts">
import type { PropType } from "vue";
import type { PlanExecution } from "@/modules/planModel";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { analyzePlanWithAi, type AiInsightResult } from "@/services/aiInsights";
import { isAiConfigured, loadAiSettings } from "@/services/aiSettings";

const props = defineProps({
  execution: {
    type: Object as PropType<PlanExecution | null>,
    default: null,
  },
});

const { t, locale } = useI18n();

type AnalysisStatus = "idle" | "loading" | "done" | "error";

interface AnalysisState {
  status: AnalysisStatus;
  result?: AiInsightResult | null;
  raw?: string;
  error?: string;
  updatedAt?: string;
}

const settings = ref(loadAiSettings());
const cache = ref<Record<string, AnalysisState>>({});

const currentKey = computed(() => props.execution?.summary.id ?? "none");
const currentState = computed(() => cache.value[currentKey.value]);
const isConfigured = computed(() => isAiConfigured(settings.value));
const canAnalyze = computed(() => Boolean(props.execution) && isConfigured.value);

function setState(key: string, patch: Partial<AnalysisState>) {
  const current = cache.value[key] ?? { status: "idle" };
  cache.value = {
    ...cache.value,
    [key]: { ...current, ...patch },
  };
}

async function runAnalysis() {
  if (!props.execution) return;
  const key = props.execution.summary.id;
  const latestSettings = loadAiSettings();
  settings.value = latestSettings;
  if (!isAiConfigured(latestSettings)) {
    setState(key, { status: "error", error: t("insights.missingConfig") });
    return;
  }
  setState(key, { status: "loading", error: undefined });
  try {
    const { result, raw } = await analyzePlanWithAi(props.execution, latestSettings, locale.value);
    setState(key, {
      status: "done",
      result,
      raw,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    setState(key, {
      status: "error",
      error: err instanceof Error ? err.message : t("insights.error"),
    });
  }
}

function refreshSettings() {
  settings.value = loadAiSettings();
}

onMounted(() => {
  window.addEventListener("hpv:ai-settings", refreshSettings);
});

onBeforeUnmount(() => {
  window.removeEventListener("hpv:ai-settings", refreshSettings);
});
</script>

<template>
  <div class="insight-panel">
    <header class="insight-header">
      <div>
        <h3>{{ t("insights.title") }}</h3>
        <p class="subtitle">{{ t("insights.subtitle") }}</p>
      </div>
      <button class="glow" :disabled="!canAnalyze || currentState?.status === 'loading'" @click="runAnalysis">
        {{
          currentState?.status === "done"
            ? t("insights.rerun")
            : currentState?.status === "loading"
              ? t("insights.analyzing")
              : t("insights.run")
        }}
      </button>
    </header>

    <p v-if="!execution" class="empty">{{ t("insights.noPlan") }}</p>
    <p v-else-if="!isConfigured" class="empty">{{ t("insights.missingConfig") }}</p>

    <div v-else class="analysis-body">
      <div class="context-hint">
        <span>{{ t("insights.contextHint") }}</span>
        <span class="model">{{ t("insights.modelLabel") }}: {{ settings.model || "-" }}</span>
      </div>

      <div v-if="currentState?.status === 'loading'" class="loading">
        <div class="loading-bar"></div>
        <p>{{ t("insights.analyzing") }}</p>
      </div>

      <div v-else-if="currentState?.status === 'error'" class="error">
        <p>{{ t("insights.error") }}</p>
        <span>{{ currentState?.error }}</span>
      </div>

      <div v-else-if="currentState?.status === 'done' && currentState.result" class="analysis-grid">
        <section class="analysis-card">
          <h4>{{ t("insights.summary") }}</h4>
          <p>{{ currentState.result.summary }}</p>
          <div class="quality">
            <span class="label">{{ t("insights.quality") }}</span>
            <span class="value" :data-rating="currentState.result.planQuality.rating">
              {{ currentState.result.planQuality.rating }}
            </span>
          </div>
          <ul>
            <li v-for="item in currentState.result.planQuality.rationale" :key="item">{{ item }}</li>
          </ul>
          <p v-if="currentState.updatedAt" class="timestamp">
            {{ t("insights.updatedAt") }} {{ new Date(currentState.updatedAt).toLocaleString() }}
          </p>
        </section>

        <section class="analysis-card">
          <h4>{{ t("insights.findings") }}</h4>
          <div v-if="currentState.result.findings.length" class="stack">
            <article v-for="item in currentState.result.findings" :key="item.title" class="analysis-item">
              <span class="chip" :class="`chip-${item.severity}`">{{ item.severity }}</span>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
                <small v-if="item.evidence">{{ item.evidence }}</small>
              </div>
            </article>
          </div>
          <p v-else class="empty">{{ t("insights.none") }}</p>
        </section>

        <section class="analysis-card">
          <h4>{{ t("insights.recommendations") }}</h4>
          <div v-if="currentState.result.recommendations.length" class="stack">
            <article
              v-for="item in currentState.result.recommendations"
              :key="item.action"
              class="analysis-item"
            >
              <div>
                <strong>{{ item.action }}</strong>
                <p>{{ item.rationale }}</p>
                <small v-if="item.impact">{{ item.impact }}</small>
              </div>
            </article>
          </div>
          <p v-else class="empty">{{ t("insights.none") }}</p>
        </section>

        <section class="analysis-card">
          <h4>{{ t("insights.indexHints") }}</h4>
          <div v-if="currentState.result.indexHints.length" class="stack">
            <article v-for="(item, idx) in currentState.result.indexHints" :key="idx" class="analysis-item">
              <div>
                <strong>{{ item.table || t("insights.indexGeneric") }}</strong>
                <p>{{ item.columns.join(", ") }}</p>
                <small>{{ item.reason }}</small>
              </div>
            </article>
          </div>
          <p v-else class="empty">{{ t("insights.none") }}</p>
        </section>

        <section class="analysis-card">
          <h4>{{ t("insights.followUps") }}</h4>
          <ul v-if="currentState.result.followUps.length">
            <li v-for="item in currentState.result.followUps" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="empty">{{ t("insights.none") }}</p>
        </section>

        <section class="analysis-card">
          <h4>{{ t("insights.sources") }}</h4>
          <ul v-if="currentState.result.sources.length">
            <li v-for="source in currentState.result.sources" :key="source.url">
              <strong>{{ source.title }}</strong>
              <span> — </span>
              <a :href="source.url" target="_blank" rel="noreferrer">{{ source.url }}</a>
              <p>{{ source.reason }}</p>
            </li>
          </ul>
          <p v-else class="empty">{{ t("insights.none") }}</p>
        </section>
      </div>

      <div v-else-if="currentState?.status === 'done' && currentState.raw" class="analysis-card">
        <h4>{{ t("insights.raw") }}</h4>
        <pre>{{ currentState.raw }}</pre>
      </div>

      <p v-else class="empty">{{ t("insights.noRun") }}</p>
    </div>
  </div>
</template>

<style scoped>
.insight-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.analysis-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.context-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.6rem 0.9rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.context-hint .model {
  font-weight: 600;
  color: var(--text-secondary);
}

.analysis-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.analysis-card {
  padding: 1rem;
  border-radius: 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.analysis-card h4 {
  margin: 0;
}

.analysis-card p {
  margin: 0;
  color: var(--text-secondary);
}

.analysis-card ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-secondary);
}

.analysis-card li {
  margin-bottom: 0.5rem;
}

.analysis-card a {
  color: var(--accent-1);
}

.analysis-item {
  display: flex;
  gap: 0.6rem;
  padding: 0.6rem 0.65rem;
  border-radius: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
}

.analysis-item p {
  margin: 0.2rem 0 0;
}

.analysis-item small {
  display: block;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 0.55rem;
  border-radius: 999px;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
}

.chip-info {
  background: rgba(56, 189, 248, 0.2);
  color: #0ea5e9;
}

.chip-warn {
  background: rgba(245, 158, 11, 0.2);
  color: #b45309;
}

.chip-critical {
  background: rgba(239, 71, 111, 0.2);
  color: #be123c;
}

.quality {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.quality .value {
  text-transform: uppercase;
  font-weight: 700;
}

.quality .value[data-rating="good"] {
  color: var(--accent-3);
}

.quality .value[data-rating="needs_attention"] {
  color: var(--warn);
}

.quality .value[data-rating="critical"] {
  color: var(--critical);
}

.timestamp {
  margin-top: auto;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.loading {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 16px;
  background: var(--bg-soft);
  border: 1px dashed var(--border);
}

.loading-bar {
  width: 160px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  animation: pulse 1.4s ease-in-out infinite;
}

.error {
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(239, 71, 111, 0.25);
  background: rgba(239, 71, 111, 0.08);
  color: #be123c;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

pre {
  white-space: pre-wrap;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.8rem;
  margin: 0;
}

.empty {
  text-align: center;
  color: var(--text-muted);
}

@keyframes pulse {
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.35;
  }
}
</style>
