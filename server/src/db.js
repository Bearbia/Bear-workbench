import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(join(dataDir, 'workbench.db'))
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// ---------- 建表 ----------
db.exec(`
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  category TEXT DEFAULT '默认',
  due_date TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  all_day INTEGER DEFAULT 1,
  color TEXT DEFAULT '#935542',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT,
  color TEXT DEFAULT 'parchment',
  pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  content TEXT,
  mood TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '默认',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 专注会话（番茄钟）
CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration INTEGER DEFAULT 0,        -- 实际专注秒数
  planned INTEGER DEFAULT 1500,      -- 计划秒数（默认 25 分钟）
  task TEXT,                         -- 关联任务/标签
  completed INTEGER DEFAULT 0,       -- 是否完整完成（1=完成，0=中断）
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 习惯
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-circle-check',
  color TEXT DEFAULT '#935542',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 习惯打卡记录
CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  date TEXT NOT NULL,                -- YYYY-MM-DD
  created_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE (habit_id, date)
);
`)

// ---------- 首次预置示例数据 ----------
const todoCount = db.prepare('SELECT count(*) as c FROM todos').get()
if (todoCount.c === 0) {
  const today = new Date()
  const iso = (d) => d.toISOString().slice(0, 10)
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d) }

  const insertTodo = db.prepare(`INSERT INTO todos (title, description, priority, status, category, due_date) VALUES (@title, @description, @priority, @status, @category, @due_date)`)
  const seedTodos = [
    { title: '完成工作台首版开发', description: '搭建 Vue + SQLite 个人工作台', priority: 'high', status: 'pending', category: '开发', due_date: iso(today) },
    { title: '审阅本周数据报表', description: '核对各模块数据一致性', priority: 'medium', status: 'pending', category: '数据', due_date: addDays(1) },
    { title: '重构待办模块排序逻辑', description: '按优先级+截止日期排序', priority: 'urgent', status: 'pending', category: '开发', due_date: iso(today) },
    { title: '整理快捷链接收藏', description: '分类常用开发与数据工具', priority: 'low', status: 'done', category: '杂事', due_date: addDays(-1) },
    { title: '设计看板 ECharts 配色', description: '棕铜/黄铜/苔绿系列', priority: 'medium', status: 'done', category: '设计', due_date: addDays(-2) }
  ]
  const insertMany = (rows) => { db.exec('BEGIN'); try { rows.forEach(r => insertTodo.run(r)); db.exec('COMMIT') } catch (e) { db.exec('ROLLBACK'); throw e } }
  insertMany(seedTodos)

  const insertNote = db.prepare(`INSERT INTO notes (title, content, color, pinned) VALUES (@title, @content, @color, @pinned)`)
  insertNote.run({ title: '欢迎使用', content: '## 熊师傅的工作台\n\n这是你的**速记便签**，支持 Markdown。\n\n- 点击便签可编辑\n- 可置顶 / 改色 / 删除', color: 'parchment', pinned: 1 })
  insertNote.run({ title: '开发备忘', content: '- 路由：`/api/notes`\n- 颜色变量：`--copper: #935542`', color: 'brass', pinned: 0 })
  insertNote.run({ title: '灵感', content: '仪表盘表盘风格的统计数字外框 🛠️', color: 'moss', pinned: 0 })

  const insertJournal = db.prepare(`INSERT INTO journals (date, content, mood) VALUES (@date, @content, @mood)`)
  insertJournal.run({ date: addDays(-1), content: '## 昨日\n\n完成工作台后端骨架，确定棕铜工坊视觉方向。明日继续前端模块。', mood: 'good' })

  const insertEvent = db.prepare(`INSERT INTO events (title, description, start_date, end_date, color) VALUES (@title, @description, @start_date, @end_date, @color)`)
  insertEvent.run({ title: '工作台开发', description: '前端模块联调', start_date: iso(today), end_date: iso(today), color: '#935542' })
  insertEvent.run({ title: '数据周报', description: '整理本周数据报表', start_date: addDays(1), end_date: addDays(1), color: '#c9a961' })

  const insertLink = db.prepare(`INSERT INTO links (title, url, description, category) VALUES (@title, @url, @description, @category)`)
  const seedLinks = [
    { title: 'Vue 3 文档', url: 'https://cn.vuejs.org/', description: '渐进式 JavaScript 框架', category: '开发' },
    { title: 'Vite', url: 'https://cn.vitejs.dev/', description: '下一代前端构建工具', category: '开发' },
    { title: 'ECharts', url: 'https://echarts.apache.org/zh/', description: '数据可视化图表库', category: '数据' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/zh-CN/', description: 'Web 开发参考文档', category: '开发' },
    { title: 'GitHub', url: 'https://github.com/', description: '代码托管平台', category: '开发' }
  ]
  const insertLinksTx = (rows) => { db.exec('BEGIN'); try { rows.forEach(r => insertLink.run(r)); db.exec('COMMIT') } catch (e) { db.exec('ROLLBACK'); throw e } }
  insertLinksTx(seedLinks)
}

// ---------- 番茄钟示例数据（独立检查，兼容已存在 DB） ----------
const focusCount = db.prepare('SELECT count(*) as c FROM focus_sessions').get()
if (focusCount.c === 0) {
  const today = new Date()
  const dt = (n, h, m) => { const d = new Date(today); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d }
  const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ')
  const insertFocus = db.prepare(`INSERT INTO focus_sessions (start_time, end_time, duration, planned, task, completed) VALUES (@start_time, @end_time, @duration, @planned, @task, @completed)`)
  const seedFocus = [
    { start_time: fmt(dt(-2, 9, 5)), end_time: fmt(dt(-2, 9, 30)), duration: 1500, planned: 1500, task: '工作台开发', completed: 1 },
    { start_time: fmt(dt(-2, 9, 40)), end_time: fmt(dt(-2, 10, 5)), duration: 1500, planned: 1500, task: '工作台开发', completed: 1 },
    { start_time: fmt(dt(-1, 14, 0)), end_time: fmt(dt(-1, 14, 18)), duration: 1080, planned: 1500, task: '设计配色', completed: 0 },
    { start_time: fmt(dt(-1, 15, 10)), end_time: fmt(dt(-1, 15, 35)), duration: 1500, planned: 1500, task: '后端联调', completed: 1 },
    { start_time: fmt(dt(0, 10, 0)), end_time: fmt(dt(0, 10, 25)), duration: 1500, planned: 1500, task: '番茄钟开发', completed: 1 }
  ]
  db.exec('BEGIN'); try { seedFocus.forEach(r => insertFocus.run(r)); db.exec('COMMIT') } catch (e) { db.exec('ROLLBACK'); throw e }
}

// ---------- 习惯示例数据 + 打卡记录（独立检查） ----------
const habitCount = db.prepare('SELECT count(*) as c FROM habits').get()
if (habitCount.c === 0) {
  const today = new Date()
  const iso = (d) => d.toISOString().slice(0, 10)
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d) }
  const insertHabit = db.prepare(`INSERT INTO habits (name, icon, color) VALUES (@name, @icon, @color)`)
  const habits = [
    { name: '喝水', icon: 'fa-droplet', color: '#4a7d9e' },
    { name: '读书', icon: 'fa-book', color: '#935542' },
    { name: '运动', icon: 'fa-person-running', color: '#6b7d4f' }
  ]
  db.exec('BEGIN'); try { habits.forEach(r => insertHabit.run(r)); db.exec('COMMIT') } catch (e) { db.exec('ROLLBACK'); throw e }

  // 为每个习惯预置近 30 天随机打卡（约 60-75% 完成率）
  const insertLog = db.prepare(`INSERT OR IGNORE INTO habit_logs (habit_id, date) VALUES (?, ?)`)
  const habitIds = db.prepare('SELECT id FROM habits').all().map(r => r.id)
  const logs = []
  habitIds.forEach((hid, i) => {
    const rate = 0.6 + (i % 3) * 0.08
    for (let d = 29; d >= 0; d--) {
      if (Math.random() < rate) logs.push([hid, addDays(-d)])
    }
    logs.push([hid, addDays(0)])
    logs.push([hid, addDays(-1)])
  })
  db.exec('BEGIN')
  try { logs.forEach(([hid, date]) => insertLog.run(hid, date)); db.exec('COMMIT') }
  catch (e) { db.exec('ROLLBACK'); throw e }
}

export default db
