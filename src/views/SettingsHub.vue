<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { supportedLocales, setLocalePreference } from "@/services/i18n";
import { loadAiSettings, saveAiSettings } from "@/services/aiSettings";
import {
  applyThemePreference,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/services/themeSettings";

const { t, locale } = useI18n();
const language = ref(locale.value as string);
const aiSettings = ref(loadAiSettings());
const theme = ref<ThemePreference>(loadThemePreference());

const themeOptions = computed(() => [
  { value: "light", label: t("settings.theme.light") },
  { value: "dark", label: t("settings.theme.dark") },
  { value: "system", label: t("settings.theme.system") },
]);

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

watch(theme, (val) => {
  saveThemePreference(val);
  applyThemePreference(val);
});
</script>

<template>
  <div class="settings-page">
    <header class="settings-header">
      <RouterLink class="back-button" to="/" aria-label="Back">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.5 19 8.5 12l7-7" />
        </svg>
      </RouterLink>
      <div>
        <h2>{{ t("settings.title") }}</h2>
        <p>{{ t("settings.description") }}</p>
      </div>
    </header>

    <div class="settings-tabs">
      <span class="settings-tab active">{{ t("settings.tabs.general") }}</span>
      <span class="settings-tab">{{ t("settings.tabs.advanced") }}</span>
      <span class="settings-tab">{{ t("settings.tabs.usage") }}</span>
      <span class="settings-tab">{{ t("settings.tabs.about") }}</span>
    </div>

    <section class="settings-card">
      <div class="setting-item">
        <div class="setting-text">
          <h3>{{ t("settings.language") }}</h3>
          <p>{{ t("settings.languageDesc") }}</p>
        </div>
        <div class="segmented-control">
          <button
            v-for="item in supportedLocales"
            :key="item.value"
            class="segmented-button"
            :class="{ active: language === item.value }"
            type="button"
            @click="language = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-text">
          <h3>{{ t("settings.theme.title") }}</h3>
          <p>{{ t("settings.theme.description") }}</p>
        </div>
        <div class="segmented-control">
          <button
            v-for="item in themeOptions"
            :key="item.value"
            class="segmented-button"
            :class="{ active: theme === item.value }"
            type="button"
            @click="theme = item.value as ThemePreference"
          >
            <span class="icon" aria-hidden="true">
              <svg v-if="item.value === 'light'" viewBox="0 0 24 24">
                <path
                  d="M12 4.5V2m0 20v-2.5m7.42-13.92 1.77-1.77M4.81 19.19l-1.77 1.77M19.5 12H22M2 12h2.5m14.92 7.42 1.77 1.77M4.81 4.81 3.04 3.04M12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z"
                />
              </svg>
              <svg v-else-if="item.value === 'dark'" viewBox="0 0 24 24">
                <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path
                  d="M4 6.5h16M7 19h10M6 6.5v11.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.5M8.5 3h7"
                />
              </svg>
            </span>
            {{ item.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="settings-card">
      <div class="setting-text">
        <h3>{{ t("settings.ai.title") }}</h3>
        <p>{{ t("settings.ai.description") }}</p>
      </div>
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
.settings-page {
  padding: 1.5rem 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.settings-header p {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
}

.back-button {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-panel);
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-button svg {
  width: 20px;
  height: 20px;
  stroke: var(--text-primary);
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.back-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.settings-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.35rem;
  box-shadow: var(--shadow-card);
}

.settings-tab {
  text-align: center;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.settings-tab.active {
  background: var(--accent-1);
  color: #fff;
  box-shadow: 0 12px 20px rgba(59, 130, 246, 0.25);
}

.settings-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  background: var(--bg-panel);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.setting-text h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.setting-text p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.segmented-control {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 0.5rem;
  background: var(--bg-soft);
  border-radius: 14px;
  border: 1px solid var(--border);
  padding: 0.35rem;
}

.segmented-button {
  border: none;
  border-radius: 12px;
  padding: 0.45rem 0.9rem;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.segmented-button .icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.segmented-button svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.8;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.segmented-button.active {
  background: var(--accent-1);
  color: #fff;
  box-shadow: 0 10px 16px rgba(59, 130, 246, 0.2);
}

.ai-grid {
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
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  color: var(--text-primary);
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

.ai-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .setting-item {
    flex-direction: column;
    align-items: stretch;
  }
  .segmented-control {
    width: 100%;
  }
}
</style>
