import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/todos  支持 ?status=&category=&due=
router.get('/', (req, res) => {
  const { status, category, due } = req.query
  let sql = 'SELECT * FROM todos WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (category && category !== '全部') { sql += ' AND category = ?'; params.push(category) }
  if (due) { sql += ' AND due_date = ?'; params.push(due) }
  sql += ` ORDER BY status ASC, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC, due_date ASC, id DESC`
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '未找到' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { title, description, priority, category, due_date } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })
  const info = db.prepare(`INSERT INTO todos (title, description, priority, category, due_date) VALUES (?, ?, ?, ?, ?)`)
    .run(title.trim(), description || null, priority || 'medium', category || '默认', due_date || null)
  res.status(201).json(db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id)
  if (!todo) return res.status(404).json({ error: '未找到' })
  const { title, description, priority, status, category, due_date } = req.body
  const completed_at = status === 'done' && todo.status !== 'done' ? new Date().toISOString() : (status === 'pending' ? null : todo.completed_at)
  db.prepare(`UPDATE todos SET title=?, description=?, priority=?, status=?, category=?, due_date=?, completed_at=? WHERE id=?`)
    .run(
      title ?? todo.title,
      description ?? todo.description,
      priority ?? todo.priority,
      status ?? todo.status,
      category ?? todo.category,
      due_date ?? todo.due_date,
      completed_at,
      req.params.id
    )
  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: '未找到' })
  res.json({ success: true })
})

export default router
