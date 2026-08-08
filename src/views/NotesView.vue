<script setup>
import { ref, computed, onMounted } from 'vue'
import { notesApi } from '@/api/notes.js'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import EmptyState from '@/components/EmptyState.vue'

const notes = ref([])
const loading = ref(true)
const editingId = ref(null)
const showEditor = ref(false)
const draft = ref(emptyDraft())

const colors = [
  { value: 'parchment', label: '羊皮', bg: 'rgba(232,220,200,0.6)' },
  { value: 'copper', label: '棕铜', bg: 'rgba(176,117,97,0.35)' },
  { value: 'brass', label: '黄铜', bg: 'rgba(201,169,97,0.4)' },
  { value: 'moss', label: '苔绿', bg: 'rgba(107,125,79,0.35)' },
  { value: 'ember', label: '余烬', bg: 'rgba(196,102,58,0.35)' }
]

function emptyDraft() { return { title: '', content: '', color: 'parchment', pinned: 0 } }

const sorted = computed(() => {
  return [...notes.value].sort((a, b) => (b.pinned - a.pinned) || (b.id - a.id))
})

async function load() {
  loading.value = true
  try { notes.value = await notesApi.list() }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openNew() { editingId.value = null; draft.value = emptyDraft(); showEditor.value = true }
function openEdit(n) { editingId.value = n.id; draft.value = { title: n.title || '', content: n.content || '', color: n.color, pinned: n.pinned }; showEditor.value = true }
function closeEditor() { showEditor.value = false; editingId.value = null }

async function save() {
  if (!draft.value.title.trim() && !draft.value.content.trim()) { closeEditor(); return }
  if (editingId.value) await notesApi.update(editingId.value, { ...draft.value })
  else await notesApi.create({ ...draft.value })
  closeEditor()
  await load()
}

async function togglePin(n) { await notesApi.update(n.id, { pinned: n.pinned ? 0 : 1 }); await load() }
async function remove(n) { await notesApi.remove(n.id); await load() }
async function cycleColor(n) {
  const idx = colors.findIndex(c => c.value === n.color)
  const next = colors[(idx + 1) % colors.length].value
  await notesApi.update(n.id, { color: next }); await load()
}

function colorStyle(c) {
  return colors.find(x => x.value === c)?.bg || colors[0].bg
}

function solidColor(c) {
  const map = { parchment: '#e8dcc8', copper: '#d4a99a', brass: '#e0cd92', moss: '#a8b88e', ember: '#dba88e' }
  return map[c] || '#e8dcc8'
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head between">
      <div>
        <h1><i class="fa-solid fa-note-sticky"></i> 速记便签</h1>
        <p class="sub">灵感与备忘 · 支持 Markdown · 点击便签编辑</p>
      </div>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> 新建便签</button>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div><span>加载中…</span></div>

    <div v-else-if="!sorted.length" class="card">
      <EmptyState icon="fa-note-sticky" text="还没有便签，记下第一个灵感吧" />
    </div>

    <div v-else class="notes-wall stagger">
      <article v-for="n in sorted" :key="n.id" class="note-card" :style="{ background: colorStyle(n.color) }" :class="{ pinned: n.pinned }">
        <div class="note-top">
          <button class="pin-btn" :class="{ active: n.pinned }" @click="togglePin(n)" title="置顶">
            <i class="fa-solid" :class="n.pinned ? 'fa-thumbtack' : 'fa-thumbtack-slash'"></i>
          </button>
          <div class="note-actions">
            <button class="btn-icon" @click="cycleColor(n)" title="换色"><i class="fa-solid fa-palette"></i></button>
            <button class="btn-icon" @click="openEdit(n)" title="编辑"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon" @click="remove(n)" title="删除"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <h3 v-if="n.title" class="note-title">{{ n.title }}</h3>
        <MarkdownRenderer :content="n.content" class="note-content" />
        <div class="note-foot mono">{{ n.updated_at?.slice(5, 16).replace('T', ' ') }}</div>
      </article>
    </div>

    <!-- 编辑器弹层 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditor" class="editor-mask" @click.self="closeEditor">
          <div class="editor-panel scale-in" :style="{ background: solidColor(draft.color) }">
            <div class="editor-head">
              <input v-model="draft.title" placeholder="标题（可选）" class="ed-title" />
              <button class="btn-icon" @click="closeEditor"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <textarea v-model="draft.content" placeholder="支持 Markdown：## 标题、**加粗**、- 列表…" class="ed-content"></textarea>
            <div class="editor-foot">
              <div class="color-pick">
                <button v-for="c in colors" :key="c.value" class="color-dot" :class="{ active: draft.color === c.value }" :style="{ background: c.bg }" :title="c.label" @click="draft.color = c.value"></button>
              </div>
              <div class="foot-right">
                <label class="pin-check"><input type="checkbox" :checked="draft.pinned" @change="draft.pinned = $event.target.checked ? 1 : 0" /> 置顶</label>
                <button class="btn btn-primary" @click="save"><i class="fa-solid fa-check"></i> 保存</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 40px; }

.notes-wall {
  column-count: 4; column-gap: 18px;
}
.note-card {
  break-inside: avoid;
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transition: transform 0.22s, box-shadow 0.22s;
  position: relative;
}
.note-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.note-card.pinned { border-color: var(--brass); box-shadow: 0 4px 16px rgba(201,169,97,0.25); }

.note-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.pin-btn { color: var(--ink-faint); font-size: 14px; width: 26px; height: 26px; border-radius: 6px; }
.pin-btn.active { color: var(--copper); }
.pin-btn:hover { background: rgba(0,0,0,0.06); }
.note-actions { display: flex; gap: 2px; }
.note-title { font-family: var(--font-serif); font-size: 17px; margin-bottom: 6px; }
.note-content { font-size: 14px; }
.note-foot { font-size: 11px; color: var(--ink-faint); margin-top: 10px; text-align: right; }

.editor-mask { position: fixed; inset: 0; background: rgba(42,31,23,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.editor-panel { width: 100%; max-width: 560px; max-height: 80vh; border-radius: var(--radius-lg); border: 1px solid var(--border-strong); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; }
.editor-head { display: flex; align-items: center; gap: 8px; padding: 14px 18px; }
.ed-title { font-size: 18px; font-weight: 700; font-family: var(--font-serif); background: transparent; border: none; flex: 1; }
.ed-title:focus { box-shadow: none; }
.ed-content { flex: 1; min-height: 220px; border: none; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); border-radius: 0; background: rgba(255,250,240,0.5); padding: 16px 18px; font-size: 15px; line-height: 1.7; }
.ed-content:focus { box-shadow: none; border-color: var(--border); }
.editor-foot { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; gap: 12px; }
.color-pick { display: flex; gap: 6px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.1); }
.color-dot.active { border-color: var(--copper); transform: scale(1.15); }
.foot-right { display: flex; align-items: center; gap: 14px; }
.pin-check { font-size: 13px; color: var(--text-soft); display: flex; align-items: center; gap: 5px; }
.pin-check input { width: auto; }

@media (max-width: 1100px) { .notes-wall { column-count: 3; } }
@media (max-width: 760px) { .notes-wall { column-count: 2; } }
@media (max-width: 480px) { .notes-wall { column-count: 1; } }
</style>
