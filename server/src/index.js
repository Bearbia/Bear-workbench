import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

import todosRouter from './routes/todos.js'
import eventsRouter from './routes/events.js'
import notesRouter from './routes/notes.js'
import journalsRouter from './routes/journals.js'
import linksRouter from './routes/links.js'
import statsRouter from './routes/stats.js'
import focusRouter from './routes/focus.js'
import habitsRouter from './routes/habits.js'
import searchRouter from './routes/search.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// API 路由
app.use('/api/todos', todosRouter)
app.use('/api/events', eventsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/journals', journalsRouter)
app.use('/api/links', linksRouter)
app.use('/api/stats', statsRouter)
app.use('/api/focus', focusRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/search', searchRouter)

// 生产环境托管前端构建产物
const distDir = join(__dirname, '..', '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
}

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`🔧 熊师傅的工作台后端已启动: http://localhost:${PORT}`)
})
