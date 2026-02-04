import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import PlanWorkspace from "@/views/PlanWorkspace.vue";
import SettingsHub from "@/views/SettingsHub.vue";
import HistoryWorkspace from "@/views/HistoryWorkspace.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "workspace",
    component: PlanWorkspace,
  },
  {
    path: "/history",
    name: "history",
    component: HistoryWorkspace,
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsHub,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
