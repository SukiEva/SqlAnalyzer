import { createI18n } from "vue-i18n";

const STORAGE_KEY = "hpv:locale";

function detectLocale(): string {
  if (typeof window === "undefined") return "zh";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("zh")) return "zh";
  return "en";
}

const messages = {
  en: {
    app: {
      title: "Sql Analyzer",
      workspace: "Workspace",
      history: "History",
      settings: "Settings",
      importPlan: "Import Plan",
      runExplain: "Run EXPLAIN",
      insights: "Insights",
    },
    plan: {
      emptyState: "Import a plan to begin.",
      tabs: {
        structure: "Plan Tree",
        sql: "SQL Context",
        timeline: "Timeline",
        metrics: "Metrics",
      },
      stats: {
        nodes: "Nodes",
        runtime: "Runtime",
        memory: "Memory",
      },
      sql: {
        title: "Associated SQL",
        badge: "Context",
        empty: "No SQL text was attached to this plan.",
      },
      node: {
        rows: "Rows",
        time: "Time",
        dn: "Node",
      },
      timeline: {
        topNodes: "Top {count} nodes",
        empty: "No plan data yet.",
      },
      meta: {
        sourceLabel: "Source",
        sourceUpload: "Manual import",
        sourceConnection: "Database connection",
      },
    },
    history: {
      hero: {
        eyebrow: "History",
        title: "Plan History",
        subtitle: "Review and manage the plans you imported recently.",
        total: "Total entries",
        latest: "Latest plan",
        none: "None",
      },
      panel: {
        title: "History",
        count: "{count} stored",
        empty: "No entries yet",
      },
      actions: {
        remove: "Remove from history",
      },
    },
    import: {
      title: "Import Execution Plan",
      defaultTitle: "Manual import",
      fields: {
        title: "Title",
        dialect: "Dialect",
        sql: "SQL (optional)",
        plan: "Plan Text / JSON",
      },
      actions: {
        cancel: "Cancel",
        confirm: "Import",
        close: "Close",
      },
      placeholders: {
        sql: "Paste original SQL to keep context",
        plan: "Paste EXPLAIN PERFORMANCE output here...",
      },
      errors: {
        empty: "Execution plan text is empty",
        parse: "Failed to parse plan",
      },
    },
    settings: {
      title: "Control Room",
      description: "Configure languages, appearance, and data policies.",
      language: "Language",
      languageDesc: "Switch UI language",
    },
    historyPanel: {
      title: "Plan History",
    },
    insights: {
      empty: "No insights yet. Import a plan to see guidance.",
    },
    tooltip: {
      officialDoc: "Open official guide",
    },
  },
  zh: {
    app: {
      title: "Sql Analyzer",
      workspace: "工作台",
      history: "历史记录",
      settings: "设置",
      importPlan: "导入计划",
      runExplain: "执行 EXPLAIN",
      insights: "洞察",
    },
    plan: {
      emptyState: "导入执行计划以开始分析",
      tabs: {
        structure: "执行计划",
        sql: "SQL 上下文",
        timeline: "时间线",
        metrics: "指标概览",
      },
      stats: {
        nodes: "节点数",
        runtime: "总耗时",
        memory: "峰值内存",
      },
      sql: {
        title: "关联 SQL",
        badge: "上下文",
        empty: "该计划没有附带 SQL 文本",
      },
      node: {
        rows: "行数",
        time: "耗时",
        dn: "节点",
      },
      timeline: {
        topNodes: "展示前 {count} 个节点",
        empty: "暂无计划数据",
      },
      meta: {
        sourceLabel: "来源",
        sourceUpload: "手动导入",
        sourceConnection: "数据库获取",
      },
    },
    history: {
      hero: {
        eyebrow: "历史",
        title: "执行计划历史",
        subtitle: "集中查看并管理最近导入的执行计划",
        total: "总条目",
        latest: "最近更新",
        none: "暂无",
      },
      panel: {
        title: "历史记录",
        count: "共 {count} 条",
        empty: "暂无历史记录",
      },
      actions: {
        remove: "从历史中删除",
      },
    },
    import: {
      title: "导入执行计划",
      defaultTitle: "手动导入",
      fields: {
        title: "标题",
        dialect: "数据库类型",
        sql: "SQL（可选）",
        plan: "计划文本 / JSON",
      },
      actions: {
        cancel: "取消",
        confirm: "导入",
        close: "关闭",
      },
      placeholders: {
        sql: "粘贴原始 SQL 以便历史分析",
        plan: "粘贴 EXPLAIN PERFORMANCE 输出内容",
      },
      errors: {
        empty: "执行计划内容不能为空",
        parse: "解析计划失败",
      },
    },
    settings: {
      title: "控制面板",
      description: "配置语言、样式以及数据策略。",
      language: "界面语言",
      languageDesc: "切换中英文界面",
    },
    historyPanel: {
      title: "执行计划历史",
    },
    insights: {
      empty: "暂无洞察，导入执行计划后可查看建议。",
    },
    tooltip: {
      officialDoc: "查看官方说明",
    },
  },
};

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: "en",
  messages,
});

export function setLocalePreference(locale: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }
  i18n.global.locale.value = locale as "en" | "zh";
}

export const supportedLocales = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export default i18n;
