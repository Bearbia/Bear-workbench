import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/focus  支持 ?from=&to=  或 ?today=1
router.get('/', (req, res) => {
  const { from, to, today } = req.query
  let sql = 'SELECT * FROM focus_sessions WHERE 1=1'
  const params = []
  if (today) {
    const d = new Date().toISOString().slice(0, 10)
    sql += ' AND start_time LIKE ?'; params.push(d + '%')
  } else {
    if (from) { sql += ' AND start_time >= ?'; params.push(from) }
    if (to) { sql += ' AND start_time <= ?'; params.push(to) }
  }
  sql += ' ORDER BY start_time DESC, id DESC'
  res.json(db.prepare(sql).all(...params))
})

// 统计：今日/本周专注时长、完成次数
router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6)
  const weekStart = weekAgo.toISOString().slice(0, 10)

  const todayRows = db.prepare("SELECT * FROM focus_sessions WHERE start_time LIKE ?").all(today + '%')
  const todaySeconds = todayRows.reduce((s, r) => s + r.duration, 0)
  const todayCount = todayRows.length
  const todayCompleted = todayRows.filter(r => r.completed).length

  const weekRows = db.prepare("SELECT * FROM focus_sessions WHERE start_time >= ?").all(weekStart + ' 00:00:00')
  const weekSeconds = weekRows.reduce((s, r) => s + r.duration, 0)
  const weekCount = weekRows.length

  // 近 7 天每日专注时长
  const days = [], labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  const daily = days.map(iso => {
    const rows = db.prepare("SELECT duration FROM focus_sessions WHERE start_time LIKE ?").all(iso + '%')
    return Math.round(rows.reduce((s, r) => s + r.duration, 0) / 60) // 分钟
  })

  // 总专注时长
  const totalRow = db.prepare("SELECT COALESCE(SUM(duration),0) as s, COUNT(*) as c FROM focus_sessions").get()

  res.json({
    todaySeconds, todayCount, todayCompleted,
    weekSeconds, weekCount,
    daily: { labels, data: daily },
    totalSeconds: totalRow.s, totalCount: totalRow.c
  })
})

// POST 创建一条专注记录（开始/结束时调用）
router.post('/', (req, res) => {
  const { start_time, end_time, duration, planned, task, completed } = req.body
  if (!start_time) return res.status(400).json({ error: '开始时间不能为空' })
  const info = db.prepare(`INSERT INTO focus_sessions (start_time, end_time, duration, planned, task, completed) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(start_time, end_time || null, duration || 0, planned || 1500, task || null, completed ? 1 : 0)
  res.status(201).json(db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(info.lastInsertRowid))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM focus_sessions WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
