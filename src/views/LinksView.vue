<script setup>
import { ref, computed, onMounted } from 'vue'
import { linksApi } from '@/api/links.js'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'

const links = ref([])
const loading = ref(true)
const search = ref('')
const catFilter = ref('全部')
const showModal = ref(false)
const editingId = ref(null)
const form = ref(emptyForm())

function emptyForm() { return { title: '', url: '', description: '', category: '默认' } }

const categories = computed(() => {
  const set = new Set(links.value.map(l => l.category).filter(Boolean))
  return ['全部', ...set]
})

const grouped = computed(() => {
  let list = links.value
  if (catFilter.value !== '全部') list = list.filter(l => l.category === catFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q))
  }
  const map = {}
  list.forEach(l => { (map[l.category] = map[l.category] || []).push(l) })
  return Object.entries(map).map(([cat, items]) => ({ cat, items }))
})

async function load() {
  loading.value = true
  try { links.value = await linksApi.list() }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

function openNew() { editingId.value = null; form.value = emptyForm(); showModal.value = true }
function openEdit(l) { editingId.value = l.id; form.value = { title: l.title, url: l.url, description: l.description || '', category: l.category }; showModal.value = true }

async function save() {
  if (!form.value.title.trim() || !form.value.url.trim()) return
  let url = form.value.url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  const data = { ...form.value, url }
  if (editingId.value) await linksApi.update(editingId.value, data)
  else await linksApi.create(data)
  showModal.value = false
  await load()
}

async function remove(l) { if (confirm(`删除「${l.title}」？`)) { await linksApi.remove(l.id); await load() } }

function favicon(url) {
  try { const d = new URL(url).hostname; return `https://favicon.cccyun.cc/${d}` }
  catch { return '' }
}
function firstChar(s) { return (s || '?').charAt(0).toUpperCase() }
function onImgError(e, title) { e.target.outerHTML = `<div class="fav-fallback">${firstChar(title)}</div>` }

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head between">
      <div>
        <h1><i class="fa-solid fa-link"></i> 快捷链接</h1>
        <p class="sub">常用工具与网站收藏 · 一键直达</p>
      </div>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> 添加链接</button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model="search" placeholder="搜索链接…" />
      </div>
      <div class="cat-tabs">
        <button v-for="c in categories" :key="c" class="cat-tab" :class="{ active: catFilter === c }" @click="catFilter = c">{{ c === '全部' ? '全部分类' : c }}</button>
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div><span>加载中…</span></div>

    <div v-else-if="!grouped.length" class="card">
      <EmptyState icon="fa-link" text="没有匹配的链接，添加一个吧" />
    </div>

    <div v-else class="groups">
      <section v-for="g in grouped" :key="g.cat" class="link-group fade-up">
        <div class="group-head">
          <div class="section-title">{{ g.cat }}</div>
          <span class="badge">{{ g.items.length }}</span>
        </div>
        <div class="link-grid stagger">
          <a v-for="l in g.items" :key="l.id" :href="l.url" target="_blank" rel="noopener" class="link-card card hoverable">
            <div class="link-top">
              <img v-if="favicon(l.url)" :src="favicon(l.url)" :alt="l.title" class="fav" @error="onImgError($event, l.title)" />
              <div v-else class="fav-fallback">{{ firstChar(l.title) }}</div>
              <div class="link-info">
                <div class="link-title">{{ l.title }}</div>
                <div class="link-host mono">{{ l.url.replace(/^https?:\/\//, '').split('/')[0] }}</div>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square open-icon"></i>
            </div>
            <p v-if="l.description" class="link-desc">{{ l.description }}</p>
            <div class="link-actions">
              <button class="btn-icon" @click.prevent="openEdit(l)" title="编辑"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon" @click.prevent="remove(l)" title="删除"><i class="fa-solid fa-trash"></i></button>
            </div>
          </a>
        </div>
      </section>
    </div>

    <BaseModal v-model="showModal" :title="editingId ? '编辑链接' : '添加链接'">
      <div class="modal-form">
        <div class="m-field">
          <label>标题</label>
          <input v-model="form.title" placeholder="如：Vue 3 文档" />
        </div>
        <div class="m-field">
          <label>网址</label>
          <input v-model="form.url" placeholder="https://example.com" />
        </div>
        <div class="m-field">
          <label>描述</label>
          <input v-model="form.description" placeholder="可选" />
        </div>
        <div class="m-field">
          <label>分类</label>
          <input v-model="form.category" placeholder="如：开发/数据" />
          <div class="cat-chips">
            <button v-for="c in categories.filter(c => c !== '全部')" :key="c" type="button"
              class="cat-chip" :class="{ active: form.category === c }" @click="form.category = c">{{ c }}</button>
          </div>
        </div>
      </div>
      <template #foot>
        <button class="btn btn-ghost" @click="showModal = false">取消</button>
        <button class="btn btn-primary" @click="save"><i class="fa-solid fa-check"></i> 保存</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.loading { display: flex; align-items: center; gap: 10px; color: var(--text-soft); padding: 40px; }

.toolbar { display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.search-box { position: relative; flex: 1; min-width: 200px; }
.search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ink-faint); font-size: 14px; }
.search-box input { padding-left: 36px; }
.cat-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.cat-tab { padding: 7px 14px; border-radius: 6px; font-size: 13px; color: var(--text-soft); background: var(--parchment-dark); border: 1px solid var(--border); transition: all 0.18s; }
.cat-tab.active { background: var(--copper); color: #fffaf0; border-color: var(--copper); }

.groups { display: flex; flex-direction: column; gap: 26px; }
.group-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.link-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }

.link-card { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.link-top { display: flex; align-items: center; gap: 12px; }
.fav { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; background: var(--parchment-dark); padding: 4px; }
.fav-fallback { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; background: linear-gradient(135deg, var(--copper), var(--copper-dark)); color: #fffaf0; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-weight: 700; font-size: 18px; }
.link-info { flex: 1; min-width: 0; }
.link-title { font-size: 15px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.link-host { font-size: 12px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.open-icon { color: var(--ink-faint); font-size: 13px; }
.link-desc { font-size: 13px; color: var(--text-soft); line-height: 1.5; }
.link-actions { display: flex; gap: 2px; justify-content: flex-end; margin-top: auto; opacity: 0; transition: opacity 0.2s; }
.link-card:hover .link-actions { opacity: 1; }

.modal-form { display: flex; flex-direction: column; gap: 14px; }
.m-field { display: flex; flex-direction: column; gap: 5px; }
.m-field label { font-size: 13px; color: var(--text-soft); }
.cat-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.cat-chip { padding: 5px 12px; border-radius: 14px; font-size: 12px; color: var(--text-soft); background: var(--parchment-dark); border: 1px solid var(--border); transition: all 0.15s; }
.cat-chip:hover { color: var(--copper); border-color: var(--copper); }
.cat-chip.active { background: var(--copper); color: #fffaf0; border-color: var(--copper); }
</style>
