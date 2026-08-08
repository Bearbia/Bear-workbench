<script setup>
const props = defineProps({
  value: { type: Number, default: 0 },     // 0-100
  max: { type: Number, default: 100 },
  label: String,
  showText: { type: Boolean, default: true }
})
</script>

<template>
  <div class="progress-wrap">
    <div v-if="label" class="progress-label">
      <span>{{ label }}</span>
      <span v-if="showText" class="mono">{{ Math.round((value / max) * 100) }}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: Math.min(100, (value / max) * 100) + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.progress-wrap { width: 100%; }
.progress-label {
  display: flex; justify-content: space-between;
  font-size: 13px; color: var(--text-soft);
  margin-bottom: 6px;
}
.progress-track {
  height: 9px;
  background: var(--parchment-dark);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brass), var(--copper));
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(201,169,97,0.5);
}
</style>
