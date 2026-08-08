<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { journalsApi } from '@/api/journals.js'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import EmptyState from '@/components/EmptyState.vue'

const journals = ref([])
const loading = ref(true)
const todayDate = new Date().toISOString().slice(0, 10)
const currentDate = ref(todayDate)
const content = ref('')
const mood = ref('normal')
const saved = ref(false)
const preview = ref(false)

const moods = [
  { value: 'great', label: '很棒', icon: 'fa-face-grin-stars', color: 'var(--brass)' },
  { value: 'good', label: '不错', icon: 'fa-face-smile', color: 'var(--moss)' },
  { value: 'normal', label: '一般', icon: 'fa-face-meh', color: 'var(--text-soft)' },
  { value: 'tired', label: '疲惫', icon: 'fa-face-tired', color: 'var(--copper)' },
  { value: 'bad', label: '糟糕', icon: 'fa-face-frown', color: 'var(--pri-urgent)' }
]

const wordCount = computed(() => content.value.replace(/\s/g, '').length)

const sorted = computed(() => [...journals.value].sort((a, b) => b.date.localeCompare(a.date)))

const todayEntry = computed(() => journals.value.find(j => j.date === currentDate.value))

async function loadAll() {
  loading.value = true
  try { journals.value = await journalsApi.list() }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadEntry(date) {
  const e = journals.value.find(j => j.date === date)
  if (e) { content.value = e.content || ''; mood.value = e.mood || 'normal' }
  else { content.value = ''; mood.value = 'normal' }
}

async function save() {
  await journalsApi.upsert({ date: currentDate.value, content: content.value, mood: mood.value })
  saved.value = true
  setTimeout(() => saved.value = false, 1800)
  await loadAll()
  await loadEntry(currentDate.value)
}

async function removeEntry(date) {
  const j = journals.value.find(x => x.date === date)
  if (!j) return
  if (!confirm('确定删除这篇日志？')) return
  await journalsApi.remove(j.id)
  if (currentDate.value === date) { content.value = ''; mood.value = 'normal' }
  await loadAll()
}

function pickDate(date) { currentDate.value = date; loadEntry(date) }
function goToday() { currentDate.value = todayDate; loadEntry(todayDate) }

function fmt(date) { return date.slice(5).replace('-', '/') }
function weekday(date) { return ['日','一','二','三','四','五','六'][new Date(date).getDay()] }

onMounted(async () => { await loadAll(); await loadEntry(currentDate.value) })
watch(currentDate, (d) => loadEntry(d))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1><i class="fa-solid fa-book-open"></i> 每日日志</h1>
      <p class="sub">工作记录与回顾 · 今日 {{ todayDate }}</p>
    </div>

    <div class="journal-layout">
      <!-- 编辑区 -->
      <div class="card editor-card fade-up">
        <div class="editor-top">
          <div class="date-block">
            <div class="big-date mono">{{ currentDate }}</div>
            <div class="week">星期{{ weekday(currentDate) }}</div>
          </div>
          <div class="editor-tools">
            <button class="btn btn-ghost" :class="{ active: !preview }" @click="preview = false"><i class="fa-solid fa-pen"></i> 编辑</button>
            <button class="btn btn-ghost" :class="{ active: preview }" @click="preview = true"><i class="fa-solid fa-eye"></i> 预览</button>
            <button class="btn btn-ghost" @click="goToday"><i class="fa-regular fa-calendar-check"></i> 今天</button>
          </div>
        </div>

        <div class="mood-row">
          <span class="mood-label">今日心情</span>
          <div class="mood-pick">
            <button v-for="m in moods" :key="m.value" class="mood-btn" :class="{ active: mood === m.value }" @click="mood = m.value">
              <i class="fa-solid" :class="m.icon" :style="{ color: mood === m.value ? m.color : '' }"></i>
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>

        <div class="editor-body">
          <textarea v-if="!preview" v-model="content" placeholder="今天做了什么？有什么收获或反思？支持 Markdown…"></textarea>
          <div v-else class="preview-area">
            <EmptyState v-if="!content" icon="fa-feather" text="还没有内容，切换编辑开始记录" />
            <MarkdownRenderer v-else :content="content" />
          </div>
        </div>

        <div class="editor-foot">
          <span class="word-count mono">{{ wordCount }} 字</span>
          <div class="foot-actions">
            <Transition name="modal"><span v-if="saved" class="saved-tip"><i class="fa-solid fa-check"></i> 已保存</span></Transition>
            <button class="btn btn-primary" @click="save"><i class="fa-solid fa-floppy-disk"></i> 保存日志</button>
          </div>
        </div>
      </div>

      <!-- 历史时间线 -->
      <div class="card timeline-card fade-up">
        <div class="section-title">历史日志 · {{ journals.length }} 篇</div>
        <EmptyState v-if="!sorted.length" icon="fa-book" text="还没有日志记录" />
        <ul v-else class="timeline">
          <li v-for="j in sorted" :key="j.date" class="tl-item" :class="{ active: j.date === currentDate, today: j.date === todayDate }" @click="pickDate(j.date)">
            <div class="tl-dot"></div>
            <div class="tl-main">
              <div class="tl-date mono">{{ j.date }} <span class="tl-week">周{{ weekday(j.date) }}</span></div>
              <div class="tl-snippet">{{ j.content?.replace(/[#*`>-]/g, '').slice(0, 40) || '（空）' }}</div>
              <div class="tl-meta">
                <i v-if="j.mood" class="fa-solid" :class="moods.find(m => m.value === j.mood)?.icon"></i>
                <span>{{ j.content?.replace(/\s/g, '').length || 0 }} 字</span>
                <button v-if="j.date !== todayDate" class="tl-del" @click.stop="removeEntry(j.date)" title="删除"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal-layout { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }
.editor-card { display: flex; flex-direction: column; min-height: 540px; }

.editor-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.big-date { font-size: 22px; font-weight: 700; color: var(--copper); }
.week { font-size: 13px; color: var(--text-soft); margin-top: 2px; }
.editor-tools { display: flex; gap: 6px; }
.editor-tools .btn { padding: 7px 12px; font-size: 13px; }
.editor-tools .btn.active { background: var(--copper); color: #fffaf0; border-color: var(--copper); }

.mood-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin-bottom: 16px; }
.mood-label { font-size: 13px; color: var(--text-soft); }
.mood-pick { display: flex; gap: 6px; flex-wrap: wrap; }
.mood-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; font-size: 13px; color: var(--text-soft); background: var(--parchment-dark); transition: all 0.18s; }
.mood-btn i { font-size: 15px; }
.mood-btn:hover { background: var(--bg-elevated); }
.mood-btn.active { background: var(--bg-card); box-shadow: 0 0 0 2px var(--copper); color: var(--text); font-weight: 600; }

.editor-body { flex: 1; }
.editor-body textarea { width: 100%; height: 320px; min-height: 320px; font-size: 15px; line-height: 1.8; resize: vertical; }
.preview-area { min-height: 320px; padding: 8px 4px; line-height: 1.8; }

.editor-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
.word-count { font-size: 13px; color: var(--text-soft); }
.foot-actions { display: flex; align-items: center; gap: 12px; }
.saved-tip { font-size: 13px; color: var(--moss); display: flex; align-items: center; gap: 4px; }

.timeline-card { position: sticky; top: 96px; max-height: calc(100vh - 120px); overflow-y: auto; }
.timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 12px; padding: 12px 8px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.18s; position: relative; }
.tl-item:hover { background: var(--parchment-dark); }
.tl-item.active { background: rgba(147,85,66,0.1); }
.tl-item.active .tl-dot { background: var(--copper); box-shadow: 0 0 0 3px rgba(147,85,66,0.2); }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border-strong); margin-top: 5px; flex-shrink: 0; }
.tl-item.today .tl-dot { background: var(--brass); }
.tl-main { flex: 1; min-width: 0; }
.tl-date { font-size: 13px; font-weight: 600; color: var(--text); }
.tl-week { font-size: 11px; color: var(--text-soft); font-weight: 400; }
.tl-snippet { font-size: 12px; color: var(--text-soft); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 11px; color: var(--ink-faint); }
.tl-del { margin-left: auto; opacity: 0; transition: opacity 0.2s; color: var(--text-soft); }
.tl-item:hover .tl-del { opacity: 1; }
.tl-del:hover { color: var(--pri-urgent); }

@media (max-width: 980px) {
  .journal-layout { grid-template-columns: 1fr; }
  .timeline-card { position: static; max-height: none; }
}
</style>
