import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/journals  支持 ?date=  或 ?from=&to=
router.get('/', (req, res) => {
  const { date, from, to } = req.query
  let sql = 'SELECT * FROM journals WHERE 1=1'
  const params = []
  if (date) { sql += ' AND date = ?'; params.push(date) }
  if (from) { sql += ' AND date >= ?'; params.push(from) }
  if (to) { sql += ' AND date <= ?'; params.push(to) }
  sql += ' ORDER BY date DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM journals WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '未找到' })
  res.json(row)
})

// 按日期 upsert
router.post('/', (req, res) => {
  const { date, content, mood } = req.body
  if (!date) return res.status(400).json({ error: '日期不能为空' })
  const existing = db.prepare('SELECT * FROM journals WHERE date = ?').get(date)
  if (existing) {
    db.prepare(`UPDATE journals SET content=?, mood=?, updated_at=datetime('now','localtime') WHERE date=?`)
      .run(content ?? '', mood ?? existing.mood, date)
    return res.json(db.prepare('SELECT * FROM journals WHERE date = ?').get(date))
  }
  const info = db.prepare(`INSERT INTO journals (date, content, mood) VALUES (?, ?, ?)`)
    .run(date, content || '', mood || null)
  res.status(201).json(db.prepare('SELECT * FROM journals WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const journal = db.prepare('SELECT * FROM journals WHERE id = ?').get(req.params.id)
  if (!journal) return res.status(404).json({ error: '未找到' })
  const { content, mood, date } = req.body
  db.prepare(`UPDATE journals SET content=?, mood=?, date=?, updated_at=datetime('now','localtime') WHERE id=?`)
    .run(content ?? journal.content, mood ?? journal.mood, date ?? journal.date, req.params.id)
  res.json(db.prepare('SELECT * FROM journals WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM journals WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
