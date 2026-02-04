<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import PlanImportModal from "@/components/PlanImportModal.vue";

const { t } = useI18n();
const openImport = ref(false);
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-title">{{ t("app.title") }}</div>
      <nav class="nav-links">
        <RouterLink class="nav-link" to="/">{{ t("app.workspace") }}</RouterLink>
        <RouterLink class="nav-link" to="/history">{{ t("app.history") }}</RouterLink>
        <RouterLink class="nav-link" to="/settings">{{ t("app.settings") }}</RouterLink>
      </nav>
      <div class="nav-actions">
        <button class="ghost" @click="openImport = true">{{ t("app.importPlan") }}</button>
        <button class="glow" disabled title="Coming soon">{{ t("app.runExplain") }}</button>
      </div>
    </header>
    <main class="router-view">
      <RouterView />
    </main>
    <PlanImportModal :open="openImport" @close="openImport = false" />
  </div>
</template>
