<script setup lang="ts">
const preferences = [
  {
    label: "Locale",
    description: "Switch UI language between English and 中文",
  },
  {
    label: "Color Theme",
    description: "Toggle light/dark/colorblind-friendly palettes",
  },
  {
    label: "Security",
    description: "Manage encryption keys and auto-wipe timers",
  },
];
</script>

<template>
  <div class="settings glass-panel">
    <h2>Control Room</h2>
    <p>Centralize application settings, security controls, and data policies.</p>
    <ul>
      <li v-for="pref in preferences" :key="pref.label">
        <h3>{{ pref.label }}</h3>
        <p>{{ pref.description }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.settings {
  padding: 2rem;
}

h2 {
  margin-top: 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 2rem 0 0;
  display: grid;
  gap: 1rem;
}

li {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

h3 {
  margin-bottom: 0.25rem;
}

p {
  margin: 0;
  color: var(--text-secondary);
}
</style>
