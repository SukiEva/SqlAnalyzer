<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { supportedLocales, setLocalePreference } from "@/services/i18n";

const { t, locale } = useI18n();
const language = ref(locale.value as string);

watch(language, (val) => {
  setLocalePreference(val);
});
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
  border-radius: 16px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.4rem 0.8rem;
  color: var(--text-primary);
}
</style>
