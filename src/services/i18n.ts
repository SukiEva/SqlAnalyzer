import { createI18n } from "vue-i18n";

const messages = {
  en: {
    app: {
      title: "Huawei Plan Visualizer",
      workspace: "Workspace",
      settings: "Settings",
      importPlan: "Import Plan",
      runExplain: "Run EXPLAIN",
      insights: "Insights",
      history: "History",
    },
    plan: {
      treeView: "Plan Tree",
      timeline: "Timeline",
      diffView: "Diff",
      annotations: "Annotations",
      metrics: "Metrics",
      documentation: "Documentation",
    },
  },
  zh: {
    app: {
      title: "华为执行计划可视化",
      workspace: "工作台",
      settings: "设置",
      importPlan: "导入计划",
      runExplain: "执行 EXPLAIN",
      insights: "诊断建议",
      history: "历史记录",
    },
    plan: {
      treeView: "计划树",
      timeline: "时间线",
      diffView: "对比",
      annotations: "注释",
      metrics: "指标",
      documentation: "文档说明",
    },
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
});

export default i18n;
