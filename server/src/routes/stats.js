import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)

  // 今日待办
  const todayTodos = db.prepare("SELECT * FROM todos WHERE due_date = ? ORDER BY status ASC, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END").all(today)
  const todayPending = todayTodos.filter(t => t.status === 'pending').length
  const todayDone = todayTodos.filter(t => t.status === 'done').length

  // 近 7 天完成趋势
  const days = []
  const dayLabels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    days.push(iso)
    dayLabels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  const trend = days.map((iso) => {
    const done = db.prepare("SELECT count(*) as c FROM todos WHERE status='done' AND due_date = ?").get(iso).c
    const created = db.prepare("SELECT count(*) as c FROM todos WHERE due_date = ?").get(iso).c
    return { date: iso, done, total: created }
  })

  // 分类分布
  const categoryDist = db.prepare("SELECT category as name, count(*) as value FROM todos GROUP BY category ORDER BY value DESC").all()

  // 优先级分布
  const priorityOrder = ['urgent', 'high', 'medium', 'low']
  const priorityLabels = { urgent: '紧急', high: '高', medium: '中', low: '低' }
  const priorityDist = priorityOrder.map(p => ({
    name: priorityLabels[p],
    value: db.prepare("SELECT count(*) as c FROM todos WHERE priority = ? AND status='pending'").get(p).c
  }))

  // 计数
  const noteCount = db.prepare('SELECT count(*) as c FROM notes').get().c
  const journalCount = db.prepare('SELECT count(*) as c FROM journals').get().c
  const linkCount = db.prepare('SELECT count(*) as c FROM links').get().c

  // 最近待办
  const recentTodos = db.prepare("SELECT * FROM todos ORDER BY id DESC LIMIT 5").all()
  // 最近日志
  const recentJournal = db.prepare("SELECT * FROM journals ORDER BY date DESC LIMIT 1").get()

  // 专注统计
  const focusToday = db.prepare("SELECT COALESCE(SUM(duration),0) as s, COUNT(*) as c FROM focus_sessions WHERE start_time LIKE ?").get(today + '%')
  const habitCount = db.prepare("SELECT count(*) as c FROM habits").get().c
  const habitDoneToday = db.prepare("SELECT COUNT(*) as c FROM habit_logs WHERE date = ?").get(today).c

  res.json({
    today,
    todayPending,
    todayDone,
    todayTotal: todayTodos.length,
    trend: { labels: dayLabels, data: trend },
    categoryDist,
    priorityDist,
    noteCount,
    journalCount,
    linkCount,
    recentTodos,
    recentJournal,
    focusTodaySeconds: focusToday.s,
    focusTodayCount: focusToday.c,
    habitCount,
    habitDoneToday
  })
})

export default router
