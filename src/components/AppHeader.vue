<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClock } from '@/composables/useClock.js'

const route = useRoute()
const { timeStr, dateStr, greeting } = useClock()

const title = computed(() => route.meta.title || '工作台')
const sub = computed(() => route.meta.sub || '')
</script>

<template>
  <header class="app-header">
    <div class="head-left">
      <h1 class="head-title">
        <i class="fa-solid" :class="route.meta.icon"></i>
        {{ title }}
      </h1>
      <p class="head-sub">{{ sub }}</p>
    </div>
    <div class="head-right">
      <div class="clock-block">
        <div class="clock-time mono">{{ timeStr() }}</div>
        <div class="clock-date">{{ dateStr() }}</div>
      </div>
      <div class="greeting">{{ greeting() }}</div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--bg-card);
  background-image: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 15;
  backdrop-filter: blur(8px);
}
[data-theme='dark'] .app-header { background-image: linear-gradient(180deg, rgba(201,169,97,0.04), transparent); }

.head-title {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}
.head-title i {
  color: var(--copper);
  font-size: 20px;
  width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(147,85,66,0.1);
  border-radius: 10px;
  border: 1px solid var(--border);
}
.head-sub { color: var(--text-soft); font-size: 13px; margin-top: 3px; margin-left: 50px; }

.head-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.clock-block { text-align: right; }
.clock-time {
  font-size: 22px;
  font-weight: 700;
  color: var(--copper);
  letter-spacing: 0.04em;
  line-height: 1;
}
.clock-date { font-size: 12px; color: var(--text-soft); margin-top: 4px; }
.greeting {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text-soft);
  padding: 8px 16px;
  background: var(--parchment-dark);
  border-radius: 20px;
  border: 1px solid var(--border);
  white-space: nowrap;
}

@media (max-width: 820px) {
  .app-header { padding: 0 18px; }
  .greeting { display: none; }
  .head-sub { display: none; }
}
</style>
