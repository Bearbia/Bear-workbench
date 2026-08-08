import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/search?q=关键字  跨 todos / notes / journals 搜索
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ todos: [], notes: [], journals: [] })
  const like = `%${q}%`

  const todos = db.prepare(`SELECT id, title, description, priority, status, category, due_date FROM todos WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC LIMIT 10`).all(like, like)
  const notes = db.prepare(`SELECT id, title, content, color FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY pinned DESC, id DESC LIMIT 10`).all(like, like)
  const journals = db.prepare(`SELECT id, date, content, mood FROM journals WHERE content LIKE ? ORDER BY date DESC LIMIT 10`).all(like)

  res.json({ todos, notes, journals })
})

export default router
