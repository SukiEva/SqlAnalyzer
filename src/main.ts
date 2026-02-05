import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import i18n from "./services/i18n";
import { applyThemePreference, loadThemePreference } from "./services/themeSettings";
import "./styles/index.css";

applyThemePreference(loadThemePreference());

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount("#app");
