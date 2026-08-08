<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchApi } from '@/api/search.js'

const router = useRouter()
const open = ref(false)
const q = ref('')
const result = ref({ todos: [], notes: [], journals: [] })
const loading = ref(false)
const inputRef = ref(null)
let debounceTimer = null

function show() {
  open.value = true
  q.value = ''
  result.value = { todos: [], notes: [], journals: [] }
  nextTick(() => inputRef.value?.focus())
}
function close() { open.value = false }

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value ? close() : show()
  } else if (e.key === 'Escape' && open.value) {
    close()
  }
}

watch(q, (val) => {
  clearTimeout(debounceTimer)
  if (!val.trim()) { result.value = { todos: [], notes: [], journals: [] }; loading.value = false; return }
  loading.value = true
  debounceTimer = setTimeout(async () => {
    try { result.value = await searchApi.query(val.trim()) }
    catch (e) { console.error(e) }
    finally { loading.value = false }
  }, 220)
})

const totalCount = computed(() => result.value.todos.length + result.value.notes.length + result.value.journals.length)

function go(type, item) {
  const routeMap = { todos: '/todos', notes: '/notes', journals: '/journal' }
  router.push(routeMap[type])
  close()
}

function highlight(text, query) {
  if (!text) return ''
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return String(text).replace(new RegExp(escaped, 'gi'), (m) => `<mark>${m}</mark>`)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="search-mask" @click.self="close">
        <div class="search-panel scale-in">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input ref="inputRef" v-model="q" placeholder="搜索待办、便签、日志…（Esc 关闭）" />
            <span class="kbd">Esc</span>
          </div>

          <div class="search-body">
            <div v-if="!q.trim()" class="search-hint">
              <i class="fa-solid fa-magnifying-glass"></i>
              <p>输入关键字，跨待办、便签、日志全文搜索</p>
            </div>

            <div v-else-if="loading" class="search-loading"><div class="spinner"></div><span>搜索中…</span></div>

            <div v-else-if="!totalCount" class="search-hint">
              <i class="fa-regular fa-face-thinking"></i>
              <p>没有找到「{{ q }}」相关内容</p>
            </div>

            <div v-else class="search-results">
              <div v-if="result.todos.length" class="result-group">
                <div class="group-head"><i class="fa-solid fa-list-check"></i> 待办 · {{ result.todos.length }}</div>
                <button v-for="t in result.todos" :key="t.id" class="result-item" @click="go('todos', t)">
                  <span class="r-icon"><i class="fa-solid fa-check-square"></i></span>
                  <span class="r-main">
                    <span class="r-title" v-html="highlight(t.title, q)"></span>
                    <span v-if="t.description" class="r-sub" v-html="highlight(t.description, q)"></span>
                  </span>
                  <span class="badge" :class="t.status === 'done' ? 'badge-moss' : 'badge-copper'">{{ t.category }}</span>
                </button>
              </div>

              <div v-if="result.notes.length" class="result-group">
                <div class="group-head"><i class="fa-solid fa-note-sticky"></i> 便签 · {{ result.notes.length }}</div>
                <button v-for="n in result.notes" :key="n.id" class="result-item" @click="go('notes', n)">
                  <span class="r-icon"><i class="fa-solid fa-note-sticky"></i></span>
                  <span class="r-main">
                    <span class="r-title" v-html="highlight(n.title || '（无标题）', q)"></span>
                    <span class="r-sub" v-html="highlight(n.content?.replace(/[#*`>-]/g, '').slice(0, 60), q)"></span>
                  </span>
                </button>
              </div>

              <div v-if="result.journals.length" class="result-group">
                <div class="group-head"><i class="fa-solid fa-book-open"></i> 日志 · {{ result.journals.length }}</div>
                <button v-for="j in result.journals" :key="j.id" class="result-item" @click="go('journals', j)">
                  <span class="r-icon"><i class="fa-solid fa-feather"></i></span>
                  <span class="r-main">
                    <span class="r-title mono">{{ j.date }}</span>
                    <span class="r-sub" v-html="highlight(j.content?.replace(/[#*`>-]/g, '').slice(0, 60), q)"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-mask {
  position: fixed; inset: 0;
  background: rgba(42, 31, 23, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  z-index: 2000;
  padding-top: 12vh;
}
.search-panel {
  width: 100%; max-width: 600px;
  max-height: 72vh;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.search-input-wrap {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.search-input-wrap > i { color: var(--text-soft); font-size: 16px; }
.search-input-wrap input { flex: 1; border: none; background: transparent; font-size: 17px; padding: 4px 0; }
.search-input-wrap input:focus { box-shadow: none; }
.kbd { font-size: 11px; color: var(--ink-faint); background: var(--parchment-dark); padding: 3px 8px; border-radius: 5px; border: 1px solid var(--border); }

.search-body { flex: 1; overflow-y: auto; padding: 8px; }
.search-hint { text-align: center; color: var(--ink-faint); padding: 40px 20px; }
.search-hint i { font-size: 30px; opacity: 0.5; display: block; margin-bottom: 10px; }
.search-loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 30px; justify-content: center; }

.result-group { margin-bottom: 8px; }
.group-head { display: flex; align-items: center; gap: 7px; padding: 8px 12px 4px; font-size: 12px; color: var(--text-soft); font-weight: 600; letter-spacing: 0.04em; }
.result-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border-radius: var(--radius-sm); text-align: left; transition: background 0.15s; }
.result-item:hover { background: var(--parchment-dark); }
.r-icon { width: 28px; height: 28px; border-radius: 7px; background: rgba(147,85,66,0.1); color: var(--copper); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.r-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.r-title { font-size: 14px; font-weight: 500; color: var(--text); }
.r-sub { font-size: 12px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(mark) { background: rgba(201,169,97,0.35); color: var(--text); border-radius: 2px; padding: 0 2px; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
