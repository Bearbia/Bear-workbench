<script setup>
import { ref, computed, onMounted } from 'vue'
import { todosApi } from '@/api/todos.js'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const todos = ref([])
const loading = ref(true)
const filter = ref('all')       // all/today/week/done
const catFilter = ref('全部')
const editingId = ref(null)
const editDraft = ref({})

const priorities = [
  { value: 'urgent', label: '紧急', color: 'var(--pri-urgent)' },
  { value: 'high', label: '高', color: 'var(--pri-high)' },
  { value: 'medium', label: '中', color: 'var(--pri-medium)' },
  { value: 'low', label: '低', color: 'var(--pri-low)' }
]

const form = ref({ title: '', description: '', priority: 'medium', category: '默认', due_date: todayStr() })

function todayStr() { return new Date().toISOString().slice(0, 10) }
function weekEnd() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10) }

const categories = computed(() => {
  const set = new Set(todos.value.map(t => t.category).filter(Boolean))
  return ['全部', ...set]
})

const filtered = computed(() => {
  let list = [...todos.value]
  if (catFilter.value !== '全部') list = list.filter(t => t.category === catFilter.value)
  if (filter.value === 'today') list = list.filter(t => t.due_date === todayStr())
  else if (filter.value === 'week') list = list.filter(t => t.due_date && t.due_date <= weekEnd() && t.due_date >= todayStr())
  else if (filter.value === 'done') list = list.filter(t => t.status === 'done')
  return list
})

const pendingList = computed(() => filtered.value.filter(t => t.status === 'pending'))
const doneList = computed(() => filtered.value.filter(t => t.status === 'done'))

const todayTodos = computed(() => todos.value.filter(t => t.due_date === todayStr()))
const todayDone = computed(() => todayTodos.value.filter(t => t.status === 'done').length)

async function load(silent = false) {
  if (!silent) loading.value = true
  try { todos.value = await todosApi.list() }
  catch (e) { console.error(e) }
  finally { if (!silent) loading.value = false }
}

async function add() {
  if (!form.value.title.trim()) return
  await todosApi.create({ ...form.value })
  form.value = { title: '', description: '', priority: 'medium', category: form.value.category, due_date: todayStr() }
  await load(true)
}

async function toggle(t) {
  await todosApi.update(t.id, { status: t.status === 'done' ? 'pending' : 'done' })
  await load(true)
}

async function remove(t) {
  try {
    await todosApi.remove(t.id)
    await load(true)
  } catch (e) { console.error(e) }
}

function startEdit(t) { editingId.value = t.id; editDraft.value = { ...t } }
function cancelEdit() { editingId.value = null; editDraft.value = {} }
async function saveEdit() {
  await todosApi.update(editingId.value, {
    title: editDraft.value.title,
    description: editDraft.value.description,
    priority: editDraft.value.priority,
    category: editDraft.value.category,
    due_date: editDraft.value.due_date
  })
  cancelEdit()
  await load(true)
}

function priColor(p) { return ({ urgent: 'var(--pri-urgent)', high: 'var(--pri-high)', medium: 'var(--pri-medium)', low: 'var(--pri-low)' })[p] || 'var(--pri-medium)' }
function priLabel(p) { return ({ urgent: '紧急', high: '高', medium: '中', low: '低' })[p] || '中' }
function fmtDate(d) { if (!d) return '无截止'; return d.slice(5).replace('-', '/') }

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1><i class="fa-solid fa-list-check"></i> 待办事项</h1>
      <p class="sub">规划今日要做的事 · 优先级排序，逐一击破</p>
    </div>

    <!-- 添加表单 -->
    <div class="card add-form fade-up">
      <div class="form-row">
        <input v-model="form.title" placeholder="今天要完成什么？回车快速添加…" class="title-input"
          @keyup.enter="add" />
        <button type="button" class="btn btn-primary" @click="add"><i class="fa-solid fa-plus"></i> 添加</button>
      </div>
      <div class="form-row form-meta">
        <div class="field">
          <label>优先级</label>
          <select v-model="form.priority">
            <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>分类</label>
          <input v-model="form.category" list="cat-list" placeholder="如：开发/数据" />
          <datalist id="cat-list">
            <option v-for="c in categories.filter(c => c !== '全部')" :key="c" :value="c" />
          </datalist>
        </div>
        <div class="field">
          <label>截止日期</label>
          <input type="date" v-model="form.due_date" />
        </div>
        <div class="field grow">
          <label>备注</label>
          <input v-model="form.description" placeholder="可选" />
        </div>
      </div>
    </div>

    <!-- 今日进度 -->
    <div class="card progress-card fade-up">
      <div class="section-title">今日完成 {{ todayDone }} / {{ todayTodos.length }}</div>
      <ProgressBar :value="todayDone" :max="todayTodos.length || 1" :showText="false" />
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button type="button" v-for="f in [{k:'all',l:'全部'},{k:'today',l:'今日'},{k:'week',l:'本周'},{k:'done',l:'已完成'}]" :key="f.k"
          class="filter-tab" :class="{ active: filter === f.k }" @click="filter = f.k">{{ f.l }}</button>
      </div>
      <div class="cat-filter">
        <select v-model="catFilter">
          <option v-for="c in categories" :key="c" :value="c">{{ c === '全部' ? '全部分类' : c }}</option>
        </select>
      </div>
    </div>

    <!-- 列表 -->
    <div v-if="loading" class="loading"><div class="spinner"></div><span>加载中…</span></div>

    <template v-else>
      <div v-if="!filtered.length" class="card">
        <EmptyState icon="fa-clipboard-check" text="这个筛选下暂无待办，干得漂亮！" />
      </div>

      <div v-else class="todo-sections">
        <div v-if="pendingList.length" class="todo-section">
          <div class="section-title">待处理 · {{ pendingList.length }}</div>
          <ul class="todo-list stagger">
            <li v-for="t in pendingList" :key="t.id" class="todo-item card hoverable" :class="`pri-${t.priority}`">
              <template v-if="editingId === t.id">
                <div class="edit-form">
                  <input v-model="editDraft.title" class="edit-title" />
                  <div class="edit-row">
                    <select v-model="editDraft.priority"><option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option></select>
                    <input v-model="editDraft.category" placeholder="分类" />
                    <input type="date" v-model="editDraft.due_date" />
                  </div>
                  <textarea v-model="editDraft.description" placeholder="备注"></textarea>
                  <div class="edit-actions">
                    <button type="button" class="btn btn-primary" @click="saveEdit"><i class="fa-solid fa-check"></i> 保存</button>
                    <button type="button" class="btn btn-ghost" @click="cancelEdit">取消</button>
                  </div>
                </div>
              </template>
              <template v-else>
                <button type="button" class="check" @click="toggle(t)" title="标记完成"><i class="fa-regular fa-circle"></i></button>
                <span class="pri-stripe" :style="{ background: priColor(t.priority) }"></span>
                <div class="todo-main">
                  <div class="todo-title">{{ t.title }}</div>
                  <div class="todo-meta">
                    <span class="badge" :class="{ 'badge-copper': t.priority==='urgent'||t.priority==='high', 'badge-brass': t.priority==='medium', 'badge-moss': t.priority==='low' }">{{ priLabel(t.priority) }}</span>
                    <span class="cat-tag"><i class="fa-solid fa-tag"></i> {{ t.category }}</span>
                    <span class="due" :class="{ overdue: t.due_date && t.due_date < todayStr() }"><i class="fa-regular fa-calendar"></i> {{ fmtDate(t.due_date) }}</span>
                    <span v-if="t.description" class="desc-hint" :title="t.description"><i class="fa-solid fa-align-left"></i></span>
                  </div>
                </div>
                <div class="todo-actions">
                  <button type="button" class="btn-icon" @click="startEdit(t)" title="编辑"><i class="fa-solid fa-pen"></i></button>
                  <button type="button" class="btn-icon" @click="remove(t)" title="删除"><i class="fa-solid fa-trash"></i></button>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <div v-if="doneList.length" class="todo-section">
          <div class="section-title">已完成 · {{ doneList.length }}</div>
          <ul class="todo-list">
            <li v-for="t in doneList" :key="t.id" class="todo-item card done-item">
              <button type="button" class="check done" @click="toggle(t)" title="取消完成"><i class="fa-solid fa-circle-check"></i></button>
              <div class="todo-main">
                <div class="todo-title">{{ t.title }}</div>
                <div class="todo-meta">
                  <span class="cat-tag"><i class="fa-solid fa-tag"></i> {{ t.category }}</span>
                  <span class="due"><i class="fa-regular fa-calendar"></i> {{ fmtDate(t.due_date) }}</span>
                </div>
              </div>
              <div class="todo-actions">
                <button type="button" class="btn-icon" @click="remove(t)" title="删除"><i class="fa-solid fa-trash"></i></button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.add-form { margin-bottom: 16px; }
.form-row { display: flex; gap: 12px; align-items: center; }
.title-input { font-size: 16px; font-weight: 500; }
.form-meta { margin-top: 12px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 4px; min-width: 130px; }
.field label { font-size: 12px; color: var(--text-soft); letter-spacing: 0.04em; }
.field select, .field input { padding: 7px 10px; font-size: 14px; }

.progress-card { margin-bottom: 18px; }

.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 14px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 6px; background: var(--parchment-dark); padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
.filter-tab { padding: 7px 16px; border-radius: 6px; font-size: 14px; color: var(--text-soft); transition: all 0.2s; }
.filter-tab.active { background: var(--bg-card); color: var(--copper); font-weight: 600; box-shadow: var(--shadow); }
.cat-filter select { padding: 8px 12px; min-width: 140px; }

.loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 40px; }
.todo-sections { display: flex; flex-direction: column; gap: 22px; }
.todo-list { display: flex; flex-direction: column; gap: 10px; }

.todo-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; }
.todo-item.pri-urgent { border-left: 3px solid var(--pri-urgent); }
.todo-item.pri-high { border-left: 3px solid var(--pri-high); }
.pri-stripe { display: none; }

.check { width: 26px; height: 26px; flex-shrink: 0; margin-top: 1px; font-size: 18px; color: var(--ink-faint); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.check:hover { color: var(--copper); }
.check.done { color: var(--moss); }

.todo-main { flex: 1; min-width: 0; }
.todo-title { font-size: 16px; font-weight: 500; color: var(--text); line-height: 1.4; }
.todo-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; font-size: 12px; color: var(--text-soft); align-items: center; }
.cat-tag { display: inline-flex; align-items: center; gap: 4px; }
.due { display: inline-flex; align-items: center; gap: 4px; }
.due.overdue { color: var(--pri-urgent); font-weight: 600; }
.desc-hint { color: var(--ink-faint); }
.todo-actions { display: flex; gap: 4px; flex-shrink: 0; }

.done-item { opacity: 0.7; }
.done-item .todo-title { text-decoration: line-through; color: var(--ink-faint); }

.edit-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.edit-title { font-size: 16px; font-weight: 500; }
.edit-row { display: flex; gap: 10px; flex-wrap: wrap; }
.edit-row select, .edit-row input { padding: 7px 10px; font-size: 14px; min-width: 110px; }
.edit-actions { display: flex; gap: 8px; }

@media (max-width: 720px) {
  .form-meta { flex-direction: column; }
  .field { width: 100%; }
  .todo-actions { flex-direction: column; }
}
</style>
