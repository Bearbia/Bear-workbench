<script setup>
import { ref, computed, onMounted } from 'vue'
import { habitsApi } from '@/api/habits.js'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'

const habits = ref([])
const loading = ref(true)
const today = new Date().toISOString().slice(0, 10)
const showModal = ref(false)
const form = ref(emptyForm())

const iconOptions = ['fa-circle-check', 'fa-droplet', 'fa-book', 'fa-person-running', 'fa-mug-hot', 'fa-dumbbell', 'fa-bed', 'fa-leaf', 'fa-music', 'fa-code']
const colorOptions = ['#935542', '#c9a961', '#6b7d4f', '#4a7d9e', '#a0522d', '#c4663a', '#7a6db8', '#3d8b7a']

function emptyForm() { return { name: '', icon: 'fa-circle-check', color: '#935542' } }

// 热力图周列：将 84 天按周分组（每周 7 天，按列展示）
function weeksOf(h) {
  if (!h.heatmap) return []
  // heatmap 是 84 天升序，转成 12 列 × 7 行
  const cols = []
  for (let w = 0; w < 12; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d
      if (idx < h.heatmap.length) col.push(h.heatmap[idx])
    }
    cols.push(col)
  }
  return cols
}

const totalDoneToday = computed(() => habits.value.filter(h => h.doneToday).length)
const completionRate = computed(() => habits.value.length ? Math.round(totalDoneToday.value / habits.value.length * 100) : 0)

async function load(silent = false) {
  if (!silent) loading.value = true
  try { habits.value = await habitsApi.list() }
  catch (e) { console.error(e) }
  finally { if (!silent) loading.value = false }
}

async function toggle(h, date) {
  try {
    const res = await habitsApi.toggle(h.id, date)
    // 本地更新：刷新该习惯的热力图与状态
    await load(true)
  } catch (e) { console.error(e) }
}

async function createHabit() {
  if (!form.value.name.trim()) return
  await habitsApi.create({ ...form.value })
  showModal.value = false
  form.value = emptyForm()
  await load(true)
}

async function removeHabit(h) {
  if (!confirm(`删除习惯「${h.name}」及其所有打卡记录？`)) return
  await habitsApi.remove(h.id)
  await load(true)
}

function fmtDate(d) { return d.slice(5) }
function isToday(d) { return d === today }

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head between">
      <div>
        <h1><i class="fa-solid fa-repeat"></i> 习惯追踪</h1>
        <p class="sub">每日打卡 · 连续坚持 · 可视化热力图</p>
      </div>
      <button class="btn btn-primary" @click="showModal = true"><i class="fa-solid fa-plus"></i> 新建习惯</button>
    </div>

    <!-- 今日总览 -->
    <div class="card today-card fade-up">
      <div class="today-left">
        <div class="ring-mini">
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--parchment-deep)" stroke-width="6" />
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--copper)" stroke-width="6" stroke-linecap="round" :stroke-dasharray="150.8" :stroke-dashoffset="150.8 * (1 - completionRate / 100)" transform="rotate(-90 30 30)" />
          </svg>
          <span class="ring-num mono">{{ completionRate }}%</span>
        </div>
        <div>
          <div class="today-title">今日完成 {{ totalDoneToday }} / {{ habits.length }}</div>
          <div class="today-sub">坚持每一天，进步看得见</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div><span>加载中…</span></div>

    <div v-else-if="!habits.length" class="card">
      <EmptyState icon="fa-repeat" text="还没有习惯，添加一个开始坚持吧" />
    </div>

    <div v-else class="habit-list stagger">
      <div v-for="h in habits" :key="h.id" class="card habit-card">
        <div class="habit-head">
          <div class="habit-icon" :style="{ background: h.color }">
            <i class="fa-solid" :class="h.icon"></i>
          </div>
          <div class="habit-info">
            <div class="habit-name">{{ h.name }}</div>
            <div class="habit-meta">
              <span class="streak"><i class="fa-solid fa-fire"></i> 连续 {{ h.streak }} 天</span>
              <span class="muted">近30天 {{ h.recent30 }}/{{ h.totalLogs }} 次</span>
            </div>
          </div>
          <button class="btn-icon" @click="removeHabit(h)" title="删除"><i class="fa-solid fa-trash"></i></button>
        </div>

        <!-- 热力图 -->
        <div class="heatmap">
          <div class="week-labels">
            <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
          </div>
          <div class="heat-grid">
            <div v-for="(col, ci) in weeksOf(h)" :key="ci" class="heat-col">
              <div v-for="(cell, di) in col" :key="di"
                class="heat-cell" :class="{ done: cell.done, today: isToday(cell.date) }"
                :style="cell.done ? { background: h.color } : {}"
                :title="`${cell.date} ${cell.done ? '已打卡' : '未打卡'}`"
                @click="toggle(h, cell.date)"
              ></div>
            </div>
          </div>
        </div>

        <!-- 今日打卡按钮 -->
        <button class="check-btn" :class="{ done: h.doneToday }" @click="toggle(h, today)">
          <i class="fa-solid" :class="h.doneToday ? 'fa-circle-check' : 'fa-circle'"></i>
          <span>{{ h.doneToday ? '今日已打卡' : '点击打卡' }}</span>
        </button>
      </div>
    </div>

    <BaseModal v-model="showModal" title="新建习惯">
      <div class="modal-form">
        <div class="m-field">
          <label>习惯名称</label>
          <input v-model="form.name" placeholder="如：每天喝水 8 杯" @keyup.enter="createHabit" />
        </div>
        <div class="m-field">
          <label>图标</label>
          <div class="icon-pick">
            <button v-for="ic in iconOptions" :key="ic" class="icon-opt" :class="{ active: form.icon === ic }" @click="form.icon = ic">
              <i class="fa-solid" :class="ic"></i>
            </button>
          </div>
        </div>
        <div class="m-field">
          <label>颜色</label>
          <div class="color-pick">
            <button v-for="c in colorOptions" :key="c" class="color-dot" :class="{ active: form.color === c }" :style="{ background: c }" @click="form.color = c"></button>
          </div>
        </div>
      </div>
      <template #foot>
        <button class="btn btn-ghost" @click="showModal = false">取消</button>
        <button class="btn btn-primary" @click="createHabit"><i class="fa-solid fa-check"></i> 创建</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 40px; }

.today-card { margin-bottom: 18px; padding: 18px 22px; }
.today-left { display: flex; align-items: center; gap: 18px; }
.ring-mini { position: relative; width: 60px; height: 60px; }
.ring-mini svg { width: 100%; height: 100%; }
.ring-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: var(--copper); }
.today-title { font-family: var(--font-serif); font-size: 20px; font-weight: 700; }
.today-sub { font-size: 13px; color: var(--text-soft); margin-top: 2px; }

.habit-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
.habit-card { padding: 12px 14px; }

.habit-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.habit-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fffaf0; font-size: 15px; flex-shrink: 0; box-shadow: var(--shadow); }
.habit-info { flex: 1; min-width: 0; }
.habit-name { font-size: 15px; font-weight: 600; font-family: var(--font-serif); }
.habit-meta { display: flex; gap: 12px; margin-top: 2px; font-size: 11px; color: var(--text-soft); }
.streak { color: var(--ember); font-weight: 600; }

.heatmap { display: flex; gap: 6px; margin-bottom: 10px; overflow-x: auto; padding-bottom: 4px; }
.week-labels { display: grid; grid-template-rows: repeat(7, 1fr); gap: 3px; font-size: 10px; color: var(--ink-faint); text-align: right; padding-right: 2px; }
.week-labels span { display: flex; align-items: center; height: 14px; }
.heat-grid { display: flex; gap: 3px; }
.heat-col { display: grid; grid-template-rows: repeat(7, 14px); gap: 3px; }
.heat-cell { width: 14px; height: 14px; border-radius: 3px; background: var(--parchment-dark); border: 1px solid var(--border); cursor: pointer; transition: transform 0.12s; }
.heat-cell.done { border-color: transparent; }
.heat-cell.today { outline: 2px solid var(--brass); outline-offset: 1px; }
.heat-cell:hover { transform: scale(1.25); }

.check-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 7px; border-radius: var(--radius-sm); border: 1px dashed var(--border-strong); color: var(--text-soft); font-size: 13px; font-weight: 500; transition: all 0.2s; }
.check-btn:hover { background: var(--parchment-dark); color: var(--copper); }
.check-btn.done { background: rgba(107,125,79,0.12); border-color: var(--moss); border-style: solid; color: var(--moss); }

.modal-form { display: flex; flex-direction: column; gap: 16px; }
.m-field { display: flex; flex-direction: column; gap: 6px; }
.m-field label { font-size: 13px; color: var(--text-soft); }
.icon-pick { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-opt { width: 38px; height: 38px; border-radius: 8px; background: var(--parchment-dark); border: 1px solid var(--border); color: var(--text-soft); transition: all 0.15s; }
.icon-opt:hover { background: var(--bg-elevated); }
.icon-opt.active { background: var(--copper); color: #fffaf0; border-color: var(--copper); }
.color-pick { display: flex; gap: 8px; flex-wrap: wrap; }
.color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; }
.color-dot.active { border-color: var(--text); transform: scale(1.1); }

@media (max-width: 720px) {
  .habit-list { grid-template-columns: 1fr; }
}
</style>
