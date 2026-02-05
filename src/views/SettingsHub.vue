<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { supportedLocales, setLocalePreference } from "@/services/i18n";
import { loadAiSettings, saveAiSettings } from "@/services/aiSettings";

const { t, locale } = useI18n();
const language = ref(locale.value as string);
const aiSettings = ref(loadAiSettings());

watch(language, (val) => {
  setLocalePreference(val);
});

watch(
  aiSettings,
  (val) => {
    saveAiSettings(val);
  },
  { deep: true },
);
</script>

<template>
  <div class="settings glass-panel">
    <h2>{{ t("settings.title") }}</h2>
    <p>{{ t("settings.description") }}</p>

    <section class="pref-card">
      <header>
        <div>
          <h3>{{ t("settings.language") }}</h3>
          <p>{{ t("settings.languageDesc") }}</p>
        </div>
        <select v-model="language">
          <option v-for="item in supportedLocales" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </header>
    </section>

    <section class="pref-card">
      <header class="ai-header">
        <div>
          <h3>{{ t("settings.ai.title") }}</h3>
          <p>{{ t("settings.ai.description") }}</p>
        </div>
      </header>
      <div class="ai-grid">
        <label class="field">
          <span>{{ t("settings.ai.baseUrl") }}</span>
          <input v-model="aiSettings.baseUrl" type="text" :placeholder="t('settings.ai.baseUrlHint')" />
        </label>
        <label class="field">
          <span>{{ t("settings.ai.model") }}</span>
          <input v-model="aiSettings.model" type="text" :placeholder="t('settings.ai.modelHint')" />
        </label>
        <label class="field">
          <span>{{ t("settings.ai.apiKey") }}</span>
          <input v-model="aiSettings.apiKey" type="password" :placeholder="t('settings.ai.apiKeyHint')" />
        </label>
      </div>
      <p class="ai-hint">{{ t("settings.ai.notice") }}</p>
    </section>
  </div>
</template>

<style scoped>
.settings {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pref-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  background: var(--bg-soft);
  box-shadow: var(--shadow-card);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

h2 {
  margin: 0;
}

h3 {
  margin: 0 0 0.35rem;
}

p {
  margin: 0;
  color: var(--text-secondary);
}

select {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.45rem 0.85rem;
  color: var(--text-primary);
  box-shadow: 0 6px 12px rgba(31, 42, 68, 0.08);
}

.ai-header {
  align-items: flex-start;
}

.ai-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.field input {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  color: var(--text-primary);
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

.ai-hint {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
