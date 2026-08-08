<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { statsApi } from '@/api/stats.js'
import StatCard from '@/components/StatCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'

const stats = ref(null)
const loading = ref(true)
const error = ref('')
const trendChart = ref(null)
const catChart = ref(null)
const priChart = ref(null)
let charts = []

const palette = ['#935542', '#c9a961', '#6b7d4f', '#a0522d', '#b07561', '#c4663a']

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await statsApi.get()
    await nextTick()
    renderCharts()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function textColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#5c4a3a'
}
function gridColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#ddd'
}

function renderCharts() {
  charts.forEach(c => c.dispose())
  charts = []
  if (!stats.value) return

  // 近 7 天完成趋势
  if (trendChart.value) {
    const c = echarts.init(trendChart.value)
    const t = stats.value.trend
    c.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#3d2b1f', borderColor: '#c9a961', textStyle: { color: '#f5ede0' } },
      legend: { data: ['计划', '完成'], textStyle: { color: textColor() }, top: 0 },
      grid: { left: 36, right: 16, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: t.labels, axisLine: { lineStyle: { color: gridColor() } }, axisLabel: { color: textColor(), fontSize: 12 } },
      yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: textColor() }, splitLine: { lineStyle: { color: gridColor() } } },
      series: [
        { name: '计划', type: 'bar', data: t.data.map(d => d.total), itemStyle: { color: '#c9a961', borderRadius: [4,4,0,0] }, barWidth: 14 },
        { name: '完成', type: 'line', data: t.data.map(d => d.done), smooth: true, lineStyle: { color: '#935542', width: 3 }, itemStyle: { color: '#935542' }, symbol: 'circle', symbolSize: 7, areaStyle: { color: 'rgba(147,85,66,0.12)' } }
      ]
    })
    charts.push(c)
  }

  // 分类分布
  if (catChart.value) {
    const c = echarts.init(catChart.value)
    c.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#3d2b1f', borderColor: '#c9a961', textStyle: { color: '#f5ede0' } },
      legend: { bottom: 0, textStyle: { color: textColor(), fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['45%', '70%'], center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fffaf0', borderWidth: 2 },
        label: { color: textColor() },
        data: stats.value.categoryDist.length ? stats.value.categoryDist.map((d, i) => ({ ...d, itemStyle: { color: palette[i % palette.length] } })) : [{ name: '暂无', value: 1 }]
      }]
    })
    charts.push(c)
  }

  // 优先级分布
  if (priChart.value) {
    const c = echarts.init(priChart.value)
    c.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#3d2b1f', borderColor: '#c9a961', textStyle: { color: '#f5ede0' } },
      grid: { left: 50, right: 24, top: 16, bottom: 28 },
      xAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: textColor() }, splitLine: { lineStyle: { color: gridColor() } } },
      yAxis: { type: 'category', data: stats.value.priorityDist.map(d => d.name), axisLine: { lineStyle: { color: gridColor() } }, axisLabel: { color: textColor(), fontSize: 12 } },
      series: [{
        type: 'bar', data: stats.value.priorityDist.map((d, i) => ({ value: d.value, itemStyle: { color: palette[i % palette.length], borderRadius: [0,4,4,0] } })), barWidth: 18
      }]
    })
    charts.push(c)
  }
}

function onResize() { charts.forEach(c => c.resize()) }

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach(c => c.dispose())
})

function priColor(p) {
  return ({ urgent: 'var(--pri-urgent)', high: 'var(--pri-high)', medium: 'var(--pri-medium)', low: 'var(--pri-low)' })[p] || 'var(--pri-medium)'
}
function priLabel(p) {
  return ({ urgent: '紧急', high: '高', medium: '中', low: '低' })[p] || '中'
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1><i class="fa-solid fa-gauge-high"></i> 工作看板</h1>
      <p class="sub">熊师傅的数据驾驶舱 · 一目了然今日全貌</p>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div><span>加载中…</span></div>
    <div v-else-if="error" class="card error-card"><i class="fa-solid fa-triangle-exclamation"></i> {{ error }}</div>

    <template v-else-if="stats">
      <!-- 统计卡片 -->
      <div class="stat-grid stagger">
        <StatCard label="今日待办" :value="stats.todayPending" icon="fa-fire" accent="copper" :hint="`已完成 ${stats.todayDone} / 共 ${stats.todayTotal}`" />
        <StatCard label="今日完成" :value="stats.todayDone" icon="fa-circle-check" accent="moss" :hint="stats.todayTotal ? `完成率 ${Math.round(stats.todayDone/stats.todayTotal*100)}%` : '暂无任务'" />
        <StatCard label="便签总数" :value="stats.noteCount" icon="fa-note-sticky" accent="brass" hint="灵感速记" />
        <StatCard label="收藏链接" :value="stats.linkCount" icon="fa-link" accent="ember" hint="常用工具" />
      </div>

      <!-- 今日进度 -->
      <div class="card today-progress fade-up">
        <div class="section-title">今日完成进度</div>
        <ProgressBar :value="stats.todayDone" :max="stats.todayTotal || 1" />
      </div>

      <!-- 图表区 -->
      <div class="chart-grid stagger">
        <div class="card chart-card">
          <div class="section-title">近 7 天完成趋势</div>
          <div ref="trendChart" class="chart-box"></div>
        </div>
        <div class="card chart-card">
          <div class="section-title">待办分类分布</div>
          <div ref="catChart" class="chart-box"></div>
        </div>
        <div class="card chart-card">
          <div class="section-title">未完成优先级</div>
          <div ref="priChart" class="chart-box"></div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="recent-grid stagger">
        <div class="card recent-card">
          <div class="section-title">最近待办</div>
          <EmptyState v-if="!stats.recentTodos.length" icon="fa-list-check" text="还没有待办" />
          <ul v-else class="recent-list">
            <li v-for="t in stats.recentTodos" :key="t.id" class="recent-item" :class="{ done: t.status === 'done' }">
              <span class="pri-dot" :style="{ background: priColor(t.priority) }"></span>
              <span class="recent-title">{{ t.title }}</span>
              <span class="badge" :class="`badge-${t.status === 'done' ? 'moss' : 'copper'}`">{{ t.status === 'done' ? '已完成' : priLabel(t.priority) }}</span>
            </li>
          </ul>
        </div>
        <div class="card recent-card">
          <div class="section-title">最近日志</div>
          <EmptyState v-if="!stats.recentJournal" icon="fa-book-open" text="还没有日志" />
          <div v-else class="journal-snippet">
            <div class="journal-date mono"><i class="fa-solid fa-feather"></i> {{ stats.recentJournal.date }}</div>
            <p class="journal-text">{{ stats.recentJournal.content?.replace(/[#*`>-]/g, '').slice(0, 80) || '（空）' }}…</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 40px; }
.error-card { color: var(--pri-urgent); display: flex; align-items: center; gap: 10px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}
.today-progress { margin-bottom: 18px; }

.chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.chart-card { display: flex; flex-direction: column; }
.chart-box { flex: 1; min-height: 260px; }

.recent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.recent-card { min-height: 200px; }

.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--parchment-dark);
  font-size: 14px;
}
.recent-item.done .recent-title { text-decoration: line-through; color: var(--ink-faint); }
.pri-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.recent-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.journal-snippet .journal-date { color: var(--copper); font-weight: 700; font-size: 14px; margin-bottom: 8px; }
.journal-snippet .journal-text { color: var(--text-soft); font-size: 14px; line-height: 1.6; }

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .stat-grid { grid-template-columns: 1fr; }
  .recent-grid { grid-template-columns: 1fr; }
}
</style>
