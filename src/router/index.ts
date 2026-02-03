import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import PlanWorkspace from "@/views/PlanWorkspace.vue";
import SettingsHub from "@/views/SettingsHub.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "workspace",
    component: PlanWorkspace,
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
