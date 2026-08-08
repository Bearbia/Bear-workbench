import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '工作看板', icon: 'fa-gauge-high', sub: '熊师傅的数据驾驶舱' } },
  { path: '/todos', name: 'todos', component: () => import('@/views/TodoListView.vue'), meta: { title: '待办事项', icon: 'fa-list-check', sub: '今日要做的事' } },
  { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue'), meta: { title: '日程日历', icon: 'fa-calendar-days', sub: '月度日程一览' } },
  { path: '/notes', name: 'notes', component: () => import('@/views/NotesView.vue'), meta: { title: '速记便签', icon: 'fa-note-sticky', sub: '灵感与备忘' } },
  { path: '/journal', name: 'journal', component: () => import('@/views/JournalView.vue'), meta: { title: '每日日志', icon: 'fa-book-open', sub: '工作记录与回顾' } },
  { path: '/links', name: 'links', component: () => import('@/views/LinksView.vue'), meta: { title: '快捷链接', icon: 'fa-link', sub: '常用工具收藏' } },
  { path: '/pomodoro', name: 'pomodoro', component: () => import('@/views/PomodoroView.vue'), meta: { title: '番茄专注', icon: 'fa-stopwatch', sub: '专注计时与统计' } },
  { path: '/habits', name: 'habits', component: () => import('@/views/HabitsView.vue'), meta: { title: '习惯追踪', icon: 'fa-repeat', sub: '每日打卡与坚持' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

export default router
