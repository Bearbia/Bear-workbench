import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/events  支持 ?start=&end=
router.get('/', (req, res) => {
  const { start, end } = req.query
  let sql = 'SELECT * FROM events WHERE 1=1'
  const params = []
  if (start) { sql += ' AND start_date >= ?'; params.push(start) }
  if (end) { sql += ' AND start_date <= ?'; params.push(end) }
  sql += ' ORDER BY start_date ASC, id DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '未找到' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { title, description, start_date, end_date, all_day, color } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })
  if (!start_date) return res.status(400).json({ error: '开始日期不能为空' })
  const info = db.prepare(`INSERT INTO events (title, description, start_date, end_date, all_day, color) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(title.trim(), description || null, start_date, end_date || start_date, all_day === false ? 0 : 1, color || '#935542')
  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ error: '未找到' })
  const { title, description, start_date, end_date, all_day, color } = req.body
  db.prepare(`UPDATE events SET title=?, description=?, start_date=?, end_date=?, all_day=?, color=? WHERE id=?`)
    .run(
      title ?? event.title,
      description ?? event.description,
      start_date ?? event.start_date,
      end_date ?? event.end_date,
      all_day === false ? 0 : (all_day ?? event.all_day),
      color ?? event.color,
      req.params.id
    )
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
