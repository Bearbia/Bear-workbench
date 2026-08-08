# 熊师傅的工作台 · Bear-workbench

一个棕铜工坊美学的个人日常工作台，集待办、日程、便签、日志、番茄专注、习惯追踪于一体。纯前端 + 轻量 Node 后端，数据落地 SQLite，支持 PWA 离线与桌面安装。
<img width="2864" height="1468" alt="image" src="https://github.com/user-attachments/assets/ce5826d8-36fb-41cf-85df-e29ede5c46ee" />

## 功能特性

- **工作看板** — 今日待办概览、近 7 天完成趋势、分类/优先级分布、专注与习惯摘要，一屏掌握全局
- **待办事项** — 优先级（紧急/高/中/低）、分类、截止日期、状态筛选，支持排序
- **日程日历** — 月视图日程管理，支持多日事件与自定义颜色
- **速记便签** — Markdown 渲染、多色主题、置顶、拖拽排序
- **每日日志** — 按日记录工作心得，附带心情标记
- **番茄专注** — 专注/短休息/长休息三模式可调时长，SVG 进度环，自动记录会话；今日/本周/总计专注时长统计 + 近 7 天柱状图
- **习惯追踪** — 每日打卡、连续天数（streak）、近 30 天完成率、12 周热力图（点击格子切换打卡）
- **快捷链接** — 分类收藏常用工具与文档，自动抓取站点图标
- **全局搜索** — `Ctrl+K` 跨待办、便签、日志全文检索，关键字高亮，按类型分组
- **PWA** — 离线可用、可安装到桌面，静态资源预缓存，API 网络优先离线回退
- **主题** — 亮色/暗色双主题，棕铜工坊配色贯穿全局

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite 5、Vue Router 4 |
| 可视化 | ECharts 5 |
| 图标 | Font Awesome 6 |
| Markdown | marked + dompurify |
| PWA | vite-plugin-pwa |
| 后端 | Node.js、Express 4 |
| 数据库 | SQLite（Node.js 内置 `node:sqlite` 模块，无需原生依赖） |

## 环境要求

- **Node.js ≥ 22.5**（使用内置 `node:sqlite` 模块）
  - 若启动时报 `node:sqlite` 不可用，请在 server 启动命令加 `--experimental-sqlite` 标志，或升级到 Node.js 23.4+（该模块默认可用）
- npm ≥ 10

## 快速开始

### 1. 安装依赖

根目录与 server 目录各有一份 `package.json`，一键安装全部依赖：

```bash
npm run install:all
```

或手动分步安装：

```bash
npm install
npm --prefix server install
```

### 2. 开发模式（前后端热更新同时启动）

```bash
npm run dev
```

- 前端：http://localhost:5173 （Vite，含 HMR）
- 后端：http://localhost:3000 （Express，API 路径 `/api/*`）
- Vite 已配置代理，前端请求 `/api` 自动转发到后端

### 3. 生产构建

```bash
npm run build      # 构建前端到 dist/
npm start          # 启动后端，自动托管 dist/ 静态资源
```

访问 http://localhost:3000 即可使用完整应用（前后端同源）。

## PWA 安装

构建并启动后端后，用 Chrome / Edge 访问 http://localhost:3000：

- 地址栏右侧会出现「安装」图标，点击即可安装到桌面
- 安装后离线也能打开，静态资源由 Service Worker 缓存
- API 数据在网络恢复后会自动同步

> 开发模式下 PWA 缓存策略为 `dev-dist`，生产模式为 `dist`，由 `vite-plugin-pwa` 自动注入注册脚本。

## 目录结构

```
熊师傅的工作台/
├── src/                        # 前端源码
│   ├── components/             # 通用组件（侧边栏、头部、全局搜索等）
│   ├── views/                  # 页面视图（看板/待办/日历/便签/日志/番茄/习惯/链接）
│   ├── composables/            # 组合式函数（主题、时钟、API 封装）
│   ├── router/                 # 路由配置
│   ├── styles/                 # 全局样式与主题变量
│   ├── App.vue
│   └── main.js
├── server/                     # 后端源码
│   ├── src/
│   │   ├── db.js               # SQLite 建表与种子数据
│   │   ├── index.js            # Express 服务入口
│   │   └── routes/             # API 路由（todos/events/notes/journals/links/stats/focus/habits/search）
│   ├── data/                   # SQLite 数据库文件（运行时生成，已 gitignore）
│   └── package.json
├── scripts/
│   └── gen-icons.mjs           # PWA 图标生成脚本
├── public/                     # 静态资源与 PWA 图标
├── vite.config.js              # Vite + PWA 配置
└── package.json
```

## API 概览

所有接口前缀 `/api`，均返回 JSON。

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| 待办 | `/api/todos` | CRUD + 排序 |
| 日程 | `/api/events` | CRUD |
| 便签 | `/api/notes` | CRUD + 置顶/排序 |
| 日志 | `/api/journals` | 按日期 CRUD |
| 链接 | `/api/links` | CRUD + 分类 |
| 统计 | `/api/stats` | 看板聚合数据 |
| 专注 | `/api/focus` | 会话记录 + `/stats` 统计 |
| 习惯 | `/api/habits` | 习惯 CRUD + 打卡 `/toggle` + 热力图 |
| 搜索 | `/api/search?q=` | 跨待办/便签/日志全文检索 |

## 数据存储

- 数据库文件位于 [server/data/workbench.db](server/data/workbench.db)，首次启动自动建表并写入示例数据
- 文件已加入 `.gitignore`，不会提交到仓库
- 删除该文件后重启服务即可重置数据

## 主题与设计

采用「棕铜工坊」视觉语言：胡桃木侧边栏、黄铜/紫铜分隔线、羊皮纸内容区、苔绿点缀。所有颜色通过 CSS 变量统一管理，支持亮/暗双主题切换。

## 许可

MIT
