<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-title">{{ t("app.title") }}</div>
      <nav class="nav-links">
        <RouterLink class="nav-link" to="/">{{ t("app.workspace") }}</RouterLink>
        <RouterLink class="nav-link" to="/settings">{{ t("app.settings") }}</RouterLink>
      </nav>
      <div class="nav-actions">
        <button class="glow">Beta</button>
      </div>
    </header>
    <main class="router-view">
      <RouterView />
    </main>
  </div>
</template>
