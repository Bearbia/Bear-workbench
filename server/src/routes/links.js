import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM links ORDER BY sort_order ASC, id DESC').all())
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '未找到' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { title, url, description, category } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })
  if (!url || !url.trim()) return res.status(400).json({ error: '网址不能为空' })
  const info = db.prepare(`INSERT INTO links (title, url, description, category) VALUES (?, ?, ?, ?)`)
    .run(title.trim(), url.trim(), description || null, category || '默认')
  res.status(201).json(db.prepare('SELECT * FROM links WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id)
  if (!link) return res.status(404).json({ error: '未找到' })
  const { title, url, description, category } = req.body
  db.prepare(`UPDATE links SET title=?, url=?, description=?, category=? WHERE id=?`)
    .run(
      title ?? link.title,
      url ?? link.url,
      description ?? link.description,
      category ?? link.category,
      req.params.id
    )
  res.json(db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
