import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM notes ORDER BY pinned DESC, sort_order ASC, id DESC').all())
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '未找到' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { title, content, color, pinned } = req.body
  const info = db.prepare(`INSERT INTO notes (title, content, color, pinned) VALUES (?, ?, ?, ?)`)
    .run(title || null, content || '', color || 'parchment', pinned ? 1 : 0)
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id)
  if (!note) return res.status(404).json({ error: '未找到' })
  const { title, content, color, pinned } = req.body
  db.prepare(`UPDATE notes SET title=?, content=?, color=?, pinned=?, updated_at=datetime('now','localtime') WHERE id=?`)
    .run(
      title ?? note.title,
      content ?? note.content,
      color ?? note.color,
      pinned === undefined ? note.pinned : (pinned ? 1 : 0),
      req.params.id
    )
  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
