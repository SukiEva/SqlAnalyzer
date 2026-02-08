# Sql Analyzer

面向执行计划分析的桌面应用（Tauri + Vue 3），提供 SQL 上下文、执行计划树、可视化图形与 AI 洞察能力。

## 功能概览

- 执行计划导入：支持粘贴 SQL 与执行计划文本/JSON
- 结构化分析：执行计划树浏览、节点详情查看
- 可视化图：可缩放/拖拽的图谱视图，自动适配视口
- AI 洞察：基于 OpenAI 兼容接口生成结构化分析结论
- 主题切换：浅色 / 深色 / 跟随系统

## 技术栈

- 前端：Vue 3 + TypeScript + Vite
- 桌面：Tauri 2
- 状态管理：Pinia
- UI：自定义样式体系（轻量玻璃感）

## 本地开发

1. 安装依赖

```bash
bun install
```

2. 启动开发环境

```bash
bun run tauri:dev
```

## 构建打包

```bash
bun run tauri:build
```

构建产物位于：`src-tauri/target/release/bundle/`。

## 配置 AI 接入

在应用内「设置」页配置 OpenAI 兼容接口：

- Base URL：如 `https://api.openai.com/v1`
- API Key：形如 `sk-...`
- Model：如 `gpt-4o-mini`

AI 洞察会优先采用紧凑摘要，减少上下文占用。

## GitHub 打包工作流

项目包含手动触发的 GitHub Actions 工作流：

- 仅在手动触发时执行构建
- 读取 `package.json` 版本，若对应 `vX.Y.Z` Release 已存在则跳过
- 若不存在则创建草稿 Release 并上传构建产物

工作流文件：`.github/workflows/tauri-build.yml`

## 目录结构

```
src/                # 前端代码
src-tauri/          # Tauri 配置与 Rust 入口
public/             # 静态资源
```

## 常用脚本

```bash
bun run dev         # 前端开发
bun run build       # 前端构建
bun run tauri:dev   # Tauri 开发
bun run tauri:build # Tauri 构建
```

## 推荐开发环境

- VS Code + Vue (Volar)
- Tauri 插件 + rust-analyzer

## 许可证

MIT
