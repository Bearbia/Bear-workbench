<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  accent: { type: String, default: 'copper' }, // copper/brass/moss/ember
  hint: String
})
</script>

<template>
  <div class="stat-card card hoverable" :class="`accent-${accent}`">
    <div class="stat-icon">
      <i class="fa-solid" :class="icon"></i>
    </div>
    <div class="stat-body">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value mono">{{ value }}</div>
      <div v-if="hint" class="stat-hint">{{ hint }}</div>
    </div>
    <div class="gauge-ring"></div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  overflow: hidden;
}
.stat-icon {
  width: 50px; height: 50px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  background: rgba(147,85,66,0.12);
  color: var(--copper);
  border: 1px solid var(--border);
}
.accent-brass .stat-icon { background: rgba(201,169,97,0.16); color: #8a6d2a; }
.accent-moss .stat-icon { background: rgba(107,125,79,0.16); color: #4a5a36; }
.accent-ember .stat-icon { background: rgba(196,102,58,0.16); color: var(--ember); }
[data-theme='dark'] .accent-brass .stat-icon { color: var(--brass-light); }
[data-theme='dark'] .accent-moss .stat-icon { color: #9bb07a; }

.stat-label { font-size: 13px; color: var(--text-soft); letter-spacing: 0.04em; }
.stat-value {
  font-size: 30px; font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  margin-top: 2px;
}
.stat-hint { font-size: 12px; color: var(--ink-faint); margin-top: 3px; }

.gauge-ring {
  position: absolute;
  right: -30px; bottom: -30px;
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 6px solid rgba(147,85,66,0.08);
  border-top-color: rgba(147,85,66,0.25);
}
.accent-brass .gauge-ring { border-color: rgba(201,169,97,0.08); border-top-color: rgba(201,169,97,0.3); }
.accent-moss .gauge-ring { border-color: rgba(107,125,79,0.08); border-top-color: rgba(107,125,79,0.3); }
.accent-ember .gauge-ring { border-color: rgba(196,102,58,0.08); border-top-color: rgba(196,102,58,0.3); }
</style>
