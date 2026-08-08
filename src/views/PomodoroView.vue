<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { focusApi } from '@/api/focus.js'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'

// 计时配置（reactive 以便可调时长）
const modes = reactive({
  focus: { label: '专注', minutes: 25, color: '#935542', min: 5, max: 90, presets: [15, 25, 45, 60] },
  short: { label: '短休息', minutes: 5, color: '#6b7d4f', min: 1, max: 30, presets: [3, 5, 10] },
  long: { label: '长休息', minutes: 15, color: '#c9a961', min: 5, max: 60, presets: [10, 15, 20, 30] }
})
const mode = ref('focus')
const modeList = Object.keys(modes)

const totalSeconds = computed(() => modes[mode.value].minutes * 60)
const remaining = ref(totalSeconds.value)

// 调整时长：未运行时生效；若尚未开始过（remaining 等于原总时长）则同步重置剩余时间
function setMinutes(val) {
  if (running.value) return
  const cfg = modes[mode.value]
  const oldTotal = cfg.minutes * 60
  const next = Math.max(cfg.min, Math.min(cfg.max, Math.round(val)))
  if (next === cfg.minutes) return
  const shouldSyncRemaining = remaining.value === oldTotal
  cfg.minutes = next
  if (shouldSyncRemaining) remaining.value = next * 60
}
function adjustMinutes(delta) { setMinutes(modes[mode.value].minutes + delta) }
const running = ref(false)
const task = ref('')
let timer = null
let startTime = null
let sessionStartIso = null

const progress = computed(() => {
  const elapsed = totalSeconds.value - remaining.value
  return totalSeconds.value > 0 ? elapsed / totalSeconds.value : 0
})
const display = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// 圆环参数
const R = 130, C = 2 * Math.PI * R
const dashOffset = computed(() => C * (1 - progress.value))

function switchMode(m) {
  if (running.value) return
  mode.value = m
  remaining.value = totalSeconds.value
}

function start() {
  if (running.value) return
  running.value = true
  startTime = Date.now()
  sessionStartIso = new Date().toISOString().slice(0, 19).replace('T', ' ')
  timer = setInterval(tick, 250)
}
function pause() {
  running.value = false
  clearInterval(timer)
}
function reset() {
  if (running.value) return
  remaining.value = totalSeconds.value
  startTime = null
  sessionStartIso = null
}
function tick() {
  if (!startTime) return
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const left = totalSeconds.value - elapsed
  if (left <= 0) {
    remaining.value = 0
    complete(true)
  } else {
    remaining.value = left
  }
}

// 完成或中断，保存会话
async function complete(finished) {
  running.value = false
  clearInterval(timer)
  const duration = finished ? totalSeconds.value : (totalSeconds.value - remaining.value)
  if (duration >= 10) { // 至少 10 秒才记录
    try {
      await focusApi.create({
        start_time: sessionStartIso,
        end_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        duration,
        planned: totalSeconds.value,
        task: mode.value === 'focus' ? (task.value || '专注') : modes[mode.value].label,
        completed: finished ? 1 : 0
      })
    } catch (e) { console.error(e) }
  }
  remaining.value = totalSeconds.value
  startTime = null
  sessionStartIso = null
  if (finished) { notifyComplete(); await loadStats() }
}
function skip() { if (running.value || remaining.value < totalSeconds.value) complete(false) }
function notifyComplete() {
  if (Notification?.permission === 'granted') new Notification('番茄钟完成', { body: `${modes[mode.value].label}结束，${mode.value === 'focus' ? '该休息一下了' : '继续专注吧'}` })
}

// 统计
const stats = ref(null)
const chartRef = ref(null)
let chart = null

async function loadStats() {
  try {
    stats.value = await focusApi.stats()
    renderChart()
  } catch (e) { console.error(e) }
}
function textColor() { return getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#5c4a3a' }
function gridColor() { return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#ddd' }
function renderChart() {
  if (!chartRef.value || !stats.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#3d2b1f', borderColor: '#c9a961', textStyle: { color: '#f5ede0' }, formatter: p => `${p[0].axisValue}<br/>${p[0].value} 分钟` },
    grid: { left: 36, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: stats.value.daily.labels, axisLine: { lineStyle: { color: gridColor() } }, axisLabel: { color: textColor(), fontSize: 12 } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: textColor(), formatter: '{value}分' }, splitLine: { lineStyle: { color: gridColor() } } },
    series: [{
      type: 'bar', data: stats.value.daily.data, barWidth: 18,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#c9a961' }, { offset: 1, color: '#935542' }]), borderRadius: [5, 5, 0, 0] }
    }]
  })
}
function onResize() { chart?.resize() }

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
}

// 历史
const history = ref([])
async function loadHistory() {
  try { history.value = await focusApi.list({ today: 1 }) } catch (e) { console.error(e) }
}
async function removeSession(id) { await focusApi.remove(id); await Promise.all([loadStats(), loadHistory()]) }

onMounted(async () => {
  if (Notification && Notification.permission === 'default') Notification.requestPermission()
  await Promise.all([loadStats(), loadHistory()])
  window.addEventListener('resize', onResize)
})
onUnmounted(() => { clearInterval(timer); window.removeEventListener('resize', onResize); chart?.dispose() })
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1><i class="fa-solid fa-stopwatch"></i> 番茄专注</h1>
      <p class="sub">{{ modes.focus.minutes }} 分钟专注 · {{ modes.short.minutes }} 分钟休息 · 高效工作法</p>
    </div>

    <div class="pomo-layout">
      <!-- 计时器 -->
      <div class="card timer-card fade-up" :style="{ '--mode-color': modes[mode].color }">
        <div class="mode-tabs">
          <button type="button" v-for="m in modeList" :key="m" class="mode-tab" :class="{ active: mode === m }" :disabled="running" @click="switchMode(m)">{{ modes[m].label }}</button>
        </div>

        <!-- 时长调节 -->
        <div class="duration-row">
          <div class="dur-label">时长</div>
          <div class="dur-stepper" :class="{ disabled: running }">
            <button type="button" class="dur-btn" @click="adjustMinutes(-1)" :disabled="running" title="减1分钟"><i class="fa-solid fa-minus"></i></button>
            <div class="dur-value">
              <input type="number" :value="modes[mode].minutes" :disabled="running" @change="setMinutes(+($event.target.value || 0))" @keyup.enter="setMinutes(+($event.target.value || 0))" :min="modes[mode].min" :max="modes[mode].max" />
              <span class="dur-unit">分</span>
            </div>
            <button type="button" class="dur-btn" @click="adjustMinutes(1)" :disabled="running" title="加1分钟"><i class="fa-solid fa-plus"></i></button>
          </div>
          <div class="dur-presets">
            <button type="button" v-for="p in modes[mode].presets" :key="p" class="preset-chip" :class="{ active: modes[mode].minutes === p }" :disabled="running" @click="setMinutes(p)">{{ p }}分</button>
          </div>
        </div>

        <div class="ring-wrap">
          <svg class="ring" viewBox="0 0 300 300">
            <circle class="ring-bg" cx="150" cy="150" :r="R" />
            <circle class="ring-fg" cx="150" cy="150" :r="R" :stroke-dasharray="C" :stroke-dashoffset="dashOffset" />
          </svg>
          <div class="ring-center">
            <div class="time-text mono">{{ display }}</div>
            <div class="mode-label" :style="{ color: modes[mode].color }">{{ modes[mode].label }}模式</div>
          </div>
        </div>

        <div class="task-input" v-if="mode === 'focus'">
          <i class="fa-solid fa-tag"></i>
          <input v-model="task" placeholder="正在专注做什么？（可选）" :disabled="running" />
        </div>

        <div class="timer-actions">
          <button v-if="!running" class="btn btn-primary start-btn" @click="start"><i class="fa-solid fa-play"></i> 开始专注</button>
          <button v-else class="btn btn-primary start-btn" @click="pause"><i class="fa-solid fa-pause"></i> 暂停</button>
          <button class="btn btn-ghost" @click="reset" :disabled="running"><i class="fa-solid fa-rotate-left"></i> 重置</button>
          <button v-if="!running && remaining < totalSeconds" class="btn btn-ghost" @click="skip"><i class="fa-solid fa-forward"></i> 放弃</button>
          <button v-if="running" class="btn btn-ghost" @click="complete(false)"><i class="fa-solid fa-flag-checkered"></i> 提前结束</button>
        </div>
      </div>

      <!-- 统计 -->
      <div class="stats-col">
        <div class="stat-grid stagger">
          <StatCard label="今日专注" :value="fmtDuration(stats?.todaySeconds || 0)" icon="fa-fire" accent="copper" :hint="`${stats?.todayCount || 0} 次会话`" />
          <StatCard label="今日完成" :value="stats?.todayCompleted ?? 0" icon="fa-circle-check" accent="moss" hint="完整番茄数" />
          <StatCard label="本周专注" :value="fmtDuration(stats?.weekSeconds || 0)" icon="fa-calendar-week" accent="brass" :hint="`${stats?.weekCount || 0} 次会话`" />
          <StatCard label="累计专注" :value="fmtDuration(stats?.totalSeconds || 0)" icon="fa-trophy" accent="ember" :hint="`${stats?.totalCount || 0} 次会话`" />
        </div>

        <div class="card chart-card fade-up">
          <div class="section-title">近 7 天专注时长（分钟）</div>
          <div ref="chartRef" class="chart-box"></div>
        </div>
      </div>
    </div>

    <!-- 今日记录 -->
    <div class="card history-card fade-up">
      <div class="section-title">今日专注记录 · {{ history.length }} 条</div>
      <EmptyState v-if="!history.length" icon="fa-stopwatch" text="今天还没有专注记录，开始第一个番茄吧" />
      <ul v-else class="history-list">
        <li v-for="h in history" :key="h.id" class="history-item" :class="{ incomplete: !h.completed }">
          <i class="fa-solid" :class="h.completed ? 'fa-circle-check' : 'fa-circle-half-stroke'"></i>
          <div class="h-info">
            <span class="h-task">{{ h.task || '专注' }}</span>
            <span class="h-time mono">{{ h.start_time?.slice(11, 16) }} · {{ Math.round(h.duration / 60) }}分钟</span>
          </div>
          <span class="badge" :class="h.completed ? 'badge-moss' : 'badge-copper'">{{ h.completed ? '完成' : '中断' }}</span>
          <button class="btn-icon" @click="removeSession(h.id)"><i class="fa-solid fa-trash"></i></button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.pomo-layout { display: grid; grid-template-columns: 420px 1fr; gap: 18px; align-items: start; }

.timer-card { display: flex; flex-direction: column; align-items: center; padding: 24px; --mode-color: #935542; }
.mode-tabs { display: flex; gap: 6px; background: var(--parchment-dark); padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 16px; }

.duration-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center; }
.dur-label { font-size: 13px; color: var(--text-soft); }
.dur-stepper { display: flex; align-items: center; background: var(--parchment-dark); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.dur-stepper.disabled { opacity: 0.5; }
.dur-btn { width: 32px; height: 32px; color: var(--text-soft); background: transparent; transition: background 0.15s; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.dur-btn:hover:not(:disabled) { background: rgba(0,0,0,0.06); color: var(--copper); }
.dur-btn:disabled { cursor: not-allowed; }
.dur-value { display: flex; align-items: center; gap: 3px; padding: 0 6px; }
.dur-value input {
  width: 46px; border: none; background: transparent;
  text-align: center; font-size: 15px; font-weight: 600; color: var(--text);
  padding: 4px 0;
  -moz-appearance: textfield;
}
.dur-value input::-webkit-outer-spin-button, .dur-value input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.dur-value input:disabled { cursor: not-allowed; }
.dur-unit { font-size: 12px; color: var(--ink-faint); }
.dur-presets { display: flex; gap: 5px; flex-wrap: wrap; }
.preset-chip { padding: 4px 10px; border-radius: 14px; font-size: 12px; color: var(--text-soft); background: var(--parchment-dark); border: 1px solid var(--border); transition: all 0.15s; }
.preset-chip:hover:not(:disabled) { color: var(--copper); border-color: var(--copper); }
.preset-chip.active { background: var(--mode-color); color: #fffaf0; border-color: var(--mode-color); }
.preset-chip:disabled { opacity: 0.5; cursor: not-allowed; }
.mode-tab { padding: 7px 18px; border-radius: 6px; font-size: 14px; color: var(--text-soft); transition: all 0.2s; }
.mode-tab.active { background: var(--mode-color); color: #fffaf0; font-weight: 600; }
.mode-tab:disabled { opacity: 0.5; cursor: not-allowed; }

.ring-wrap { position: relative; width: 280px; height: 280px; }
.ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--parchment-dark); stroke-width: 16; }
.ring-fg { fill: none; stroke: var(--mode-color); stroke-width: 16; stroke-linecap: round; transition: stroke-dashoffset 0.3s linear; filter: drop-shadow(0 0 6px rgba(147,85,66,0.4)); }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.time-text { font-size: 56px; font-weight: 700; color: var(--text); letter-spacing: 0.04em; line-height: 1; }
.mode-label { margin-top: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; }

.task-input { display: flex; align-items: center; gap: 8px; margin-top: 22px; width: 100%; background: var(--parchment-dark); border-radius: var(--radius-sm); padding: 8px 14px; border: 1px solid var(--border); }
.task-input i { color: var(--ink-faint); }
.task-input input { border: none; background: transparent; padding: 4px 0; }
.task-input input:focus { box-shadow: none; }

.timer-actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; justify-content: center; }
.start-btn { min-width: 130px; justify-content: center; }

.stats-col { display: flex; flex-direction: column; gap: 18px; }
.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.chart-card { min-height: 220px; }
.chart-box { width: 100%; height: 240px; }

.history-card { margin-top: 18px; }
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--parchment-dark); }
.history-item.incomplete { opacity: 0.75; }
.history-item > i { color: var(--moss); font-size: 16px; }
.history-item.incomplete > i { color: var(--copper); }
.h-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.h-task { font-size: 14px; font-weight: 500; }
.h-time { font-size: 12px; color: var(--text-soft); }

@media (max-width: 980px) {
  .pomo-layout { grid-template-columns: 1fr; }
  .timer-card { align-items: center; }
}
@media (max-width: 560px) {
  .ring-wrap { width: 230px; height: 230px; }
  .time-text { font-size: 44px; }
  .duration-row { gap: 10px; }
  .dur-label { display: none; }
  .preset-chip { padding: 3px 8px; font-size: 11px; }
}
</style>
