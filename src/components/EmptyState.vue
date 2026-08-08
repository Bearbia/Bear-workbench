<script setup>
defineProps({
  icon: { type: String, default: 'fa-box-open' },
  text: { type: String, default: '暂无内容' }
})
</script>

<template>
  <div class="empty-state">
    <i class="fa-solid" :class="icon"></i>
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 56px 20px;
  color: var(--ink-faint);
}
.empty-state i {
  font-size: 40px;
  opacity: 0.4;
  margin-bottom: 14px;
  display: block;
}
.empty-state p { font-size: 14px; }
</style>
