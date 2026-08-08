import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/habits  返回习惯列表 + 今日打卡状态 + 连续天数 + 近 84 天热力数据
router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const habits = db.prepare('SELECT * FROM habits ORDER BY sort_order ASC, id ASC').all()

  // 近 84 天日期列表（12 周）
  const days = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  const result = habits.map(h => {
    const logs = db.prepare('SELECT date FROM habit_logs WHERE habit_id = ?').all(h.id).map(r => r.date)
    const logSet = new Set(logs)

    // 连续天数（从今天往前算，今天未打则从昨天算起仍计入当前连续，但为反映"当前连续"，从今天往前数连续打卡天数；今天没打则从昨天起算）
    let streak = 0
    for (let i = 0; i <= 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      if (logSet.has(iso)) streak++
      else if (i === 0) continue // 今天没打不算断
      else break
    }

    // 近 30 天完成数
    const recent30 = days.slice(-30).filter(d => logSet.has(d)).length

    // 热力数据（84 天）
    const heatmap = days.map(d => ({ date: d, done: logSet.has(d) ? 1 : 0 }))

    return { ...h, doneToday: logSet.has(today), streak, recent30, totalLogs: logs.length, heatmap }
  })

  res.json(result)
})

router.post('/', (req, res) => {
  const { name, icon, color } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: '习惯名称不能为空' })
  const info = db.prepare('INSERT INTO habits (name, icon, color) VALUES (?, ?, ?)')
    .run(name.trim(), icon || 'fa-circle-check', color || '#935542')
  res.status(201).json(db.prepare('SELECT * FROM habits WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const h = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id)
  if (!h) return res.status(404).json({ error: '未找到' })
  const { name, icon, color } = req.body
  db.prepare('UPDATE habits SET name=?, icon=?, color=? WHERE id=?')
    .run(name ?? h.name, icon ?? h.icon, color ?? h.color, req.params.id)
  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

// 打卡 / 取消打卡  POST /api/habits/:id/toggle  body: { date }
router.post('/:id/toggle', (req, res) => {
  const hid = req.params.id
  const h = db.prepare('SELECT * FROM habits WHERE id = ?').get(hid)
  if (!h) return res.status(404).json({ error: '习惯不存在' })
  const date = req.body.date || new Date().toISOString().slice(0, 10)
  const existing = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(hid, date)
  if (existing) {
    db.prepare('DELETE FROM habit_logs WHERE id = ?').run(existing.id)
    res.json({ done: false, date })
  } else {
    db.prepare('INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)').run(hid, date)
    res.json({ done: true, date })
  }
})

export default router
