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
      runner: "Runner",
      settings: "Settings",
      importPlan: "Import Plan",
      runExplain: "Run EXPLAIN",
      insights: "Insights",
    },
    plan: {
      emptyState: "Import a plan to begin.",
      tabs: {
        sql: "Context",
        structure: "Visualization",
        canvas: "Execution Plan",
        insights: "Insights",
        compare: "Compare",
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
      meta: {
        sourceLabel: "Source",
        sourceUpload: "Manual import",
        sourceConnection: "Database connection",
      },
      graph: {
        empty: "Import a plan to render the canvas view.",
        hint: "Scroll to zoom, drag to pan",
        reset: "Reset view",
        slow: "Slow",
        hot: "Hot",
      },
      details: {
        title: "Node details",
        empty: "Select a node from the tree or canvas to inspect metrics.",
        attributes: "Attributes",
        warnings: "Warnings",
        unknown: "N/A",
        nodeId: "Node",
        estimateRatio: "Rows ratio",
        emptyTab: "No details available.",
        actualRows: "Actual rows",
        estimatedRows: "Estimated rows",
        tabs: {
          general: "General",
        },
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
      description: "Manage language, theme, and AI integrations.",
      language: "Language",
      languageDesc: "Switch UI language",
      theme: {
        title: "Appearance",
        description: "Choose a theme for the interface.",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      ai: {
        title: "AI Provider",
        description: "Connect an OpenAI-compatible model for plan analysis.",
        baseUrl: "Base URL",
        baseUrlHint: "https://api.openai.com/v1",
        model: "Model",
        modelHint: "gpt-4o-mini",
        apiKey: "API Key",
        apiKeyHint: "sk-...",
        notice: "The key is stored locally and requests use the OpenAI Chat Completions format.",
      },
      db: {
        title: "Database Runner",
        description: "Configure the connection used for executing EXPLAIN statements.",
        driver: "Driver",
        connection: "Connection string",
        connectionHint: "postgresql://host:5432/database",
        username: "Username",
        usernameHint: "Database user",
        password: "Password",
        passwordHint: "Database password",
        notice: "Credentials are stored locally on this device.",
      },
    },
    historyPanel: {
      title: "Plan History",
    },
    insights: {
      title: "AI Insights",
      subtitle: "Analyze SQL and execution plan with your configured model.",
      run: "Run analysis",
      rerun: "Re-run",
      analyzing: "Analyzing...",
      noPlan: "Import a plan to analyze.",
      missingConfig: "Configure an OpenAI-compatible provider in Settings to run AI insights.",
      contextHint: "Using a compact plan digest to minimize context usage.",
      cached: "Cached",
      history: "Analysis history",
      modelLabel: "Model",
      summary: "Summary",
      quality: "Plan quality",
      findings: "Key findings",
      recommendations: "Optimization plan",
      indexHints: "Index hints",
      indexGeneric: "Index",
      followUps: "Follow-up checks",
      sources: "Sources",
      none: "No items",
      noRun: "Run analysis to see AI insights.",
      raw: "Raw response",
      error: "Analysis failed.",
      updatedAt: "Last run:",
    },
    compare: {
      title: "Plan comparison",
      hint: "Paste a new plan to highlight differences.",
      newPlanLabel: "New plan",
      oldPlanLabel: "Current plan",
      emptyOld: "No plan available for comparison.",
      emptyNew: "Paste a new plan to compare.",
      placeholder: "Paste the new execution plan",
    },
    runner: {
      title: "Runner",
      subtitle: "Execute SQL and fetch execution plans.",
      sqlLabel: "SQL",
      sqlPlaceholder: "Paste SQL statement here",
      runPlain: "Run EXPLAIN",
      runAnalyze: "Run EXPLAIN ANALYZE",
      runPerformance: "Run EXPLAIN PERFORMANCE",
      tipPlain: "Fetch the plan without execution statistics.",
      tipAnalyze: "Execute the query and collect actual runtime details.",
      tipPerformance: "Include performance details such as buffers when supported.",
      running: "Running...",
      missingConfig: "Configure database settings in Control Room before running.",
      jumpPrompt: "Execution plan ready. Jump to workspace and import it?",
      error: "Failed to run SQL.",
      modePlain: "Plain",
      modeAnalyze: "Analyze",
      modePerformance: "Performance",
      planTitle: "Runner · {mode}",
    },
  },
  zh: {
    app: {
      title: "Sql Analyzer",
      workspace: "工作台",
      history: "历史记录",
      runner: "Runner",
      settings: "设置",
      importPlan: "导入计划",
      runExplain: "执行 EXPLAIN",
      insights: "洞察",
    },
    plan: {
      emptyState: "导入执行计划以开始分析",
      tabs: {
        sql: "上下文",
        structure: "可视化",
        canvas: "执行计划",
        insights: "洞察",
        compare: "对比",
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
      meta: {
        sourceLabel: "来源",
        sourceUpload: "手动导入",
        sourceConnection: "数据库获取",
      },
      graph: {
        empty: "导入执行计划以查看画布效果",
        hint: "滚轮缩放，拖拽平移画布",
        reset: "重置视角",
        slow: "低耗时",
        hot: "热点",
      },
      details: {
        title: "节点详情",
        empty: "从树或画布中选择节点以查看指标",
        attributes: "关键属性",
        warnings: "告警信息",
        unknown: "未知",
        nodeId: "节点",
        estimateRatio: "行数比例",
        emptyTab: "暂无相关字段。",
        actualRows: "实际行数",
        estimatedRows: "预估行数",
        tabs: {
          general: "常规",
        },
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
      description: "配置语言、主题以及 AI 接入。",
      language: "界面语言",
      languageDesc: "切换中英文界面",
      theme: {
        title: "外观主题",
        description: "选择应用的外观主题，立即生效。",
        light: "浅色",
        dark: "深色",
        system: "跟随系统",
      },
      ai: {
        title: "AI 接入",
        description: "配置 OpenAI 兼容的大模型接口用于分析执行计划。",
        baseUrl: "Base URL",
        baseUrlHint: "https://api.openai.com/v1",
        model: "模型",
        modelHint: "gpt-4o-mini",
        apiKey: "API Key",
        apiKeyHint: "sk-...",
        notice: "密钥仅保存在本地，调用使用 OpenAI Chat Completions 格式。",
      },
      db: {
        title: "数据库 Runner",
        description: "配置用于执行 EXPLAIN 的数据库连接。",
        driver: "驱动",
        connection: "连接串",
        connectionHint: "postgresql://host:5432/database",
        username: "账号",
        usernameHint: "数据库账号",
        password: "密码",
        passwordHint: "数据库密码",
        notice: "连接信息仅保存在当前设备。",
      },
    },
    historyPanel: {
      title: "执行计划历史",
    },
    insights: {
      title: "AI 洞察",
      subtitle: "使用已配置的大模型分析 SQL 与执行计划。",
      run: "开始分析",
      rerun: "重新分析",
      analyzing: "分析中...",
      noPlan: "导入执行计划后可开始分析。",
      missingConfig: "请先在设置中配置 OpenAI 格式的模型接口。",
      contextHint: "已使用紧凑摘要以减少上下文占用。",
      cached: "已缓存",
      history: "分析历史",
      modelLabel: "模型",
      summary: "总体结论",
      quality: "计划质量",
      findings: "关键问题",
      recommendations: "优化建议",
      indexHints: "索引建议",
      indexGeneric: "索引",
      followUps: "后续检查",
      sources: "参考来源",
      none: "暂无",
      noRun: "点击分析以生成 AI 洞察。",
      raw: "原始输出",
      error: "分析失败。",
      updatedAt: "最近一次：",
    },
    compare: {
      title: "执行计划对比",
      hint: "粘贴新的执行计划，高亮差异。",
      newPlanLabel: "新执行计划",
      oldPlanLabel: "当前执行计划",
      emptyOld: "暂无可对比的执行计划。",
      emptyNew: "粘贴新的执行计划以进行对比。",
      placeholder: "粘贴新的执行计划文本",
    },
    runner: {
      title: "Runner",
      subtitle: "执行 SQL 并获取执行计划。",
      sqlLabel: "SQL",
      sqlPlaceholder: "粘贴需要执行的 SQL",
      runPlain: "获取执行计划",
      runAnalyze: "执行 EXPLAIN ANALYZE",
      runPerformance: "执行 EXPLAIN PERFORMANCE",
      tipPlain: "仅获取执行计划，不执行 SQL。",
      tipAnalyze: "执行 SQL 并采集实际运行信息。",
      tipPerformance: "在支持的情况下附带性能信息。",
      running: "执行中...",
      missingConfig: "请先在控制面板配置数据库连接信息。",
      jumpPrompt: "执行计划已生成，是否跳转到工作台并导入？",
      error: "执行失败。",
      modePlain: "普通",
      modeAnalyze: "Analyze",
      modePerformance: "Performance",
      planTitle: "Runner · {mode}",
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
