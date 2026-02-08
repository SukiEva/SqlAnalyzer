<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="page-nav">
    <div class="nav-left">
      <slot name="left">
        <div class="brand-title">{{ t("app.title") }}</div>
      </slot>
    </div>
    <nav class="nav-links">
      <RouterLink class="nav-link" to="/">{{ t("app.workspace") }}</RouterLink>
      <RouterLink class="nav-link" to="/history">{{ t("app.history") }}</RouterLink>
    </nav>
    <div class="nav-actions">
      <slot name="actions"></slot>
      <RouterLink class="icon-link" to="/settings" :title="t('app.settings')" aria-label="Settings">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.57.24-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.6.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.57-.24 1.12-.55 1.63-.94l2.39.96c.23.1.5 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z"
          />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  min-height: 56px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-links {
  justify-self: center;
}

.nav-actions {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
