<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { eventsApi } from '@/api/events.js'
import EmptyState from '@/components/EmptyState.vue'

const events = ref([])
const loading = ref(true)
const viewDate = ref(new Date())        // 当前视图月份
const selectedDate = ref(todayStr())    // 选中日期

const colors = ['#935542', '#c9a961', '#6b7d4f', '#a0522d', '#c4663a']
const form = ref({ title: '', description: '', start_date: todayStr(), end_date: todayStr(), color: '#935542' })
const editingId = ref(null)

function todayStr() { return new Date().toISOString().slice(0, 10) }

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const monthLabel = computed(() => `${viewDate.value.getFullYear()}年 ${viewDate.value.getMonth() + 1}月`)

// 生成月历网格（含上下月补齐，周一起始）
const grid = computed(() => {
  const y = viewDate.value.getFullYear()
  const m = viewDate.value.getMonth()
  const first = new Date(y, m, 1)
  // 周一=0 ... 周日=6
  let startWeekday = first.getDay() - 1
  if (startWeekday < 0) startWeekday = 6
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysPrev = new Date(y, m, 0).getDate()

  const cells = []
  // 上月补齐
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push(makeCell(new Date(y, m - 1, daysPrev - i), true))
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(makeCell(new Date(y, m, d), false))
  }
  // 下月补齐至 42 格
  let next = 1
  while (cells.length < 42) {
    cells.push(makeCell(new Date(y, m + 1, next++), true))
  }
  return cells
})

function makeCell(d, other) {
  const iso = d.toISOString().slice(0, 10)
  return {
    iso, day: d.getDate(), other,
    isToday: iso === todayStr(),
    selected: iso === selectedDate.value,
    events: events.value.filter(e => e.start_date <= iso && iso <= (e.end_date || e.start_date))
  }
}

const selectedEvents = computed(() => events.value.filter(e => e.start_date <= selectedDate.value && selectedDate.value <= (e.end_date || e.start_date)))

function prevMonth() { viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1) }
function nextMonth() { viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1) }
function goToday() { viewDate.value = new Date(); selectedDate.value = todayStr() }
function pickDate(iso) { selectedDate.value = iso }

async function load() {
  loading.value = true
  try {
    const y = viewDate.value.getFullYear(), m = viewDate.value.getMonth()
    const start = new Date(y, m, 1).toISOString().slice(0, 10)
    const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
    events.value = await eventsApi.list({ start, end })
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function addEvent() {
  if (!form.value.title.trim()) return
  await eventsApi.create({ ...form.value })
  form.value = { title: '', description: '', start_date: selectedDate.value, end_date: selectedDate.value, color: '#935542' }
  await load()
}

function startEdit(e) {
  editingId.value = e.id
  form.value = { title: e.title, description: e.description || '', start_date: e.start_date, end_date: e.end_date || e.start_date, color: e.color }
  selectedDate.value = e.start_date
}
function cancelEdit() { editingId.value = null; form.value = { title: '', description: '', start_date: selectedDate.value, end_date: selectedDate.value, color: '#935542' } }
async function saveEdit() {
  await eventsApi.update(editingId.value, { ...form.value })
  cancelEdit()
  await load()
}
async function removeEvent(id) { await eventsApi.remove(id); await load() }

watch(viewDate, load)

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1><i class="fa-solid fa-calendar-days"></i> 日程日历</h1>
      <p class="sub">月度日程一览 · 点击日期查看与添加事件</p>
    </div>

    <div class="cal-layout">
      <!-- 月历 -->
      <div class="card cal-card fade-up">
        <div class="cal-head">
          <button class="btn-icon" @click="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="month-label">{{ monthLabel }}</div>
          <button class="btn-icon" @click="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
          <button class="btn btn-ghost today-btn" @click="goToday"><i class="fa-regular fa-calendar-check"></i> 今天</button>
        </div>
        <div class="week-head">
          <div v-for="w in weekDays" :key="w" class="week-cell">{{ w }}</div>
        </div>
        <div class="cal-grid">
          <button
            v-for="c in grid" :key="c.iso"
            class="cal-cell" :class="{ other: c.other, today: c.isToday, selected: c.selected }"
            @click="pickDate(c.iso)"
          >
            <span class="cell-day">{{ c.day }}</span>
            <div class="cell-events">
              <span v-for="e in c.events.slice(0, 3)" :key="e.id" class="ev-dot" :style="{ background: e.color }" :title="e.title"></span>
              <span v-if="c.events.length > 3" class="ev-more">+{{ c.events.length - 3 }}</span>
            </div>
            <div v-if="c.events.length" class="cell-titles">
              <div v-for="e in c.events.slice(0,2)" :key="e.id" class="cell-title" :style="{ borderLeftColor: e.color }">{{ e.title }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- 选中日面板 -->
      <div class="card day-panel fade-up">
        <div class="day-head">
          <div>
            <div class="day-date mono">{{ selectedDate }}</div>
            <div class="day-count">{{ selectedEvents.length }} 个日程</div>
          </div>
          <button v-if="!editingId" class="btn btn-brass" @click="form.start_date = selectedDate; form.end_date = selectedDate"><i class="fa-solid fa-plus"></i> 添加</button>
        </div>

        <!-- 添加/编辑表单 -->
        <div class="ev-form">
          <input v-model="form.title" placeholder="日程标题…" @keyup.enter="editingId ? saveEdit() : addEvent()" />
          <div class="ev-meta">
            <input type="date" v-model="form.start_date" />
            <input type="date" v-model="form.end_date" />
            <div class="color-pick">
              <button v-for="c in colors" :key="c" class="color-dot" :class="{ active: form.color === c }" :style="{ background: c }" @click="form.color = c"></button>
            </div>
          </div>
          <input v-model="form.description" placeholder="描述（可选）" />
          <div class="ev-actions">
            <button v-if="editingId" class="btn btn-primary" @click="saveEdit"><i class="fa-solid fa-check"></i> 保存修改</button>
            <button v-else class="btn btn-primary" @click="addEvent"><i class="fa-solid fa-plus"></i> 添加日程</button>
            <button v-if="editingId" class="btn btn-ghost" @click="cancelEdit">取消</button>
          </div>
        </div>

        <div class="day-events">
          <EmptyState v-if="!selectedEvents.length" icon="fa-calendar-plus" text="这一天还没有日程" />
          <ul v-else class="ev-list">
            <li v-for="e in selectedEvents" :key="e.id" class="ev-item" :style="{ borderLeftColor: e.color }">
              <div class="ev-info">
                <div class="ev-title">{{ e.title }}</div>
                <div class="ev-sub">
                  <span class="mono">{{ e.start_date }}<template v-if="e.end_date !== e.start_date"> ~ {{ e.end_date }}</template></span>
                  <span v-if="e.description"> · {{ e.description }}</span>
                </div>
              </div>
              <div class="ev-actions">
                <button class="btn-icon" @click="startEdit(e)"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon" @click="removeEvent(e.id)"><i class="fa-solid fa-trash"></i></button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-layout { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; }
.cal-card { padding: 18px; }

.cal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.month-label { font-family: var(--font-serif); font-size: 22px; font-weight: 700; flex: 1; text-align: center; }
.today-btn { margin-left: auto; }

.week-head { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; }
.week-cell { text-align: center; font-size: 13px; color: var(--text-soft); font-weight: 600; padding: 6px 0; }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-cell {
  min-height: 78px; padding: 6px 7px; border-radius: 8px;
  background: var(--parchment-dark); border: 1px solid transparent;
  display: flex; flex-direction: column; gap: 3px; text-align: left;
  transition: all 0.18s;
}
.cal-cell:hover { border-color: var(--border-strong); background: var(--bg-elevated); }
.cal-cell.other { opacity: 0.4; }
.cal-cell.today { background: rgba(201,169,97,0.15); border-color: var(--brass); }
.cal-cell.today .cell-day { color: var(--copper); font-weight: 700; }
.cal-cell.selected { border-color: var(--copper); box-shadow: 0 0 0 2px rgba(147,85,66,0.2); }
.cell-day { font-size: 14px; font-weight: 500; }
.cell-events { display: flex; gap: 3px; align-items: center; }
.ev-dot { width: 6px; height: 6px; border-radius: 50%; }
.ev-more { font-size: 10px; color: var(--text-soft); }
.cell-titles { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.cell-title { font-size: 11px; color: var(--text); padding-left: 5px; border-left: 2px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.day-panel { padding: 18px; position: sticky; top: 96px; }
.day-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.day-date { font-size: 18px; font-weight: 700; color: var(--copper); }
.day-count { font-size: 12px; color: var(--text-soft); margin-top: 2px; }

.ev-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.ev-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.ev-meta input { flex: 1; min-width: 100px; padding: 7px 10px; font-size: 13px; }
.color-pick { display: flex; gap: 5px; align-items: center; }
.color-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; transition: all 0.15s; }
.color-dot.active { border-color: var(--text); transform: scale(1.15); }
.ev-actions { display: flex; gap: 8px; }

.ev-list { display: flex; flex-direction: column; gap: 8px; }
.ev-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--parchment-dark); border-left: 3px solid; }
.ev-info { flex: 1; min-width: 0; }
.ev-title { font-size: 14px; font-weight: 500; }
.ev-sub { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
.ev-actions { display: flex; gap: 2px; }

@media (max-width: 980px) {
  .cal-layout { grid-template-columns: 1fr; }
  .day-panel { position: static; }
}
@media (max-width: 560px) {
  .cal-cell { min-height: 56px; }
  .cell-titles { display: none; }
}
</style>
