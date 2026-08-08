<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'

const router = useRouter()
const route = useRoute()
const { theme, toggle } = useTheme()
const emit = defineEmits(['search'])

const nav = [
  { name: 'dashboard', to: '/dashboard', icon: 'fa-gauge-high', label: '工作看板' },
  { name: 'todos', to: '/todos', icon: 'fa-list-check', label: '待办事项' },
  { name: 'calendar', to: '/calendar', icon: 'fa-calendar-days', label: '日程日历' },
  { name: 'notes', to: '/notes', icon: 'fa-note-sticky', label: '速记便签' },
  { name: 'journal', to: '/journal', icon: 'fa-book-open', label: '每日日志' },
  { name: 'pomodoro', to: '/pomodoro', icon: 'fa-stopwatch', label: '番茄专注' },
  { name: 'habits', to: '/habits', icon: 'fa-repeat', label: '习惯追踪' },
  { name: 'links', to: '/links', icon: 'fa-link', label: '快捷链接' }
]

const collapsed = ref(false)
function go(to) { router.push(to) }
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="brand">
      <div class="brand-mark">
        <span class="brand-char">熊</span>
      </div>
      <div class="brand-text">
        <div class="brand-title">熊师傅的</div>
        <div class="brand-title2">工作台</div>
      </div>
      <button class="collapse-btn btn-icon" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
        <i class="fa-solid" :class="collapsed ? 'fa-angles-right' : 'fa-angles-left'"></i>
      </button>
    </div>

    <div class="copper-rule"></div>

    <button class="search-trigger" @click="emit('search')" title="全局搜索 (Ctrl+K)">
      <i class="fa-solid fa-magnifying-glass"></i>
      <span class="nav-label">搜索…</span>
      <span class="search-kbd">Ctrl+K</span>
    </button>

    <nav class="nav">
      <button
        v-for="item in nav" :key="item.name"
        class="nav-item" :class="{ active: route.name === item.name }"
        @click="go(item.to)" :title="item.label"
      >
        <i class="fa-solid" :class="item.icon"></i>
        <span class="nav-label">{{ item.label }}</span>
        <span class="nav-glow"></span>
      </button>
    </nav>

    <div class="sidebar-foot">
      <button class="theme-toggle" @click="toggle" :title="theme === 'light' ? '切换暗色' : '切换亮色'">
        <i class="fa-solid" :class="theme === 'light' ? 'fa-moon' : 'fa-sun'"></i>
        <span>{{ theme === 'light' ? '暗色模式' : '亮色模式' }}</span>
      </button>
      <div class="version">v1.0 · 工坊出品</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--bg-sidebar);
  background-image:
    repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 7px),
    repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0 3px, transparent 3px 9px),
    linear-gradient(160deg, #4a3424, var(--wood) 40%, #2e2016);
  color: #e8dcc8;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid rgba(0,0,0,0.3);
  box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}
.sidebar.collapsed { width: 76px; }
.sidebar.collapsed .brand-text,
.sidebar.collapsed .nav-label,
.sidebar.collapsed .theme-toggle span,
.sidebar.collapsed .version { display: none; }
.sidebar.collapsed .brand-mark { margin: 0 auto; }
.sidebar.collapsed .nav-item { justify-content: center; padding: 13px; }

/* 品牌 */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 16px;
}
.brand-mark {
  width: 44px; height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brass), var(--copper));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
  border: 1px solid rgba(201,169,97,0.5);
}
.brand-char {
  font-family: var(--font-serif);
  font-size: 26px; font-weight: 900;
  color: #fffaf0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
.brand-text { line-height: 1.15; overflow: hidden; }
.brand-title { font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: #c4ad8f; }
.brand-title2 { font-family: var(--font-serif); font-size: 20px; font-weight: 900; color: var(--brass-light); letter-spacing: 0.05em; }
.collapse-btn {
  margin-left: auto; color: #c4ad8f;
  width: 28px; height: 28px;
}
.collapse-btn:hover { color: var(--brass-light); }

.copper-rule {
  height: 2px;
  margin: 0 18px 14px;
  background: linear-gradient(90deg, transparent, var(--brass), var(--copper), var(--brass), transparent);
  box-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

/* 搜索触发 */
.search-trigger {
  display: flex; align-items: center; gap: 13px;
  width: calc(100% - 24px); margin: 6px 12px 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(201,169,97,0.2);
  color: #8a7561;
  font-size: 14px;
  transition: all 0.2s;
}
.search-trigger:hover { background: rgba(201,169,97,0.12); color: #e8dcc8; border-color: rgba(201,169,97,0.4); }
.search-trigger i { width: 20px; text-align: center; }
.search-kbd {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0,0,0,0.3);
  color: #8a7561;
}
.sidebar.collapsed .search-trigger { justify-content: center; }
.sidebar.collapsed .search-trigger .nav-label,
.sidebar.collapsed .search-trigger .search-kbd { display: none; }

/* 导航 */
.nav { padding: 6px 12px; flex: 1; overflow-y: auto; }
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 13px;
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  color: #c4ad8f;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
  transition: all 0.22s ease;
  text-align: left;
}
.nav-item i { width: 20px; text-align: center; font-size: 16px; }
.nav-item:hover {
  color: #fffaf0;
  background: rgba(201,169,97,0.1);
}
.nav-item.active {
  color: #fffaf0;
  background: linear-gradient(90deg, rgba(201,169,97,0.22), rgba(201,169,97,0.05));
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 18%; bottom: 18%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--brass-light), var(--brass));
  box-shadow: 0 0 8px rgba(201,169,97,0.6);
}
.nav-item.active i { color: var(--brass-light); }

/* 底部 */
.sidebar-foot {
  padding: 14px 16px 18px;
  border-top: 1px solid rgba(201,169,97,0.15);
}
.theme-toggle {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: #c4ad8f;
  font-size: 13px;
  transition: all 0.2s;
}
.theme-toggle:hover { background: rgba(201,169,97,0.1); color: #fffaf0; }
.theme-toggle i { width: 18px; text-align: center; }
.version { margin-top: 10px; font-size: 11px; color: #8a7561; text-align: center; letter-spacing: 0.05em; }
</style>
