<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  content: { type: String, default: '' }
})

marked.setOptions({ breaks: true, gfm: true })

const html = computed(() => {
  if (!props.content) return ''
  return DOMPurify.sanitize(marked.parse(props.content))
})
</script>

<template>
  <div class="md" v-html="html"></div>
</template>

<style scoped>
.md { font-size: 15px; line-height: 1.7; color: var(--text); word-break: break-word; }
.md :deep(h1), .md :deep(h2), .md :deep(h3) {
  font-family: var(--font-serif);
  margin: 14px 0 8px;
  font-weight: 700;
}
.md :deep(h1) { font-size: 20px; }
.md :deep(h2) { font-size: 17px; }
.md :deep(h3) { font-size: 15px; }
.md :deep(p) { margin: 6px 0; }
.md :deep(ul), .md :deep(ol) { margin: 6px 0; padding-left: 22px; list-style: revert; }
.md :deep(li) { margin: 3px 0; }
.md :deep(code) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--parchment-dark);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--copper-dark);
}
[data-theme='dark'] .md :deep(code) { color: var(--brass-light); }
.md :deep(pre) {
  background: var(--parchment-dark);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--border);
}
.md :deep(pre code) { background: none; padding: 0; }
.md :deep(strong) { font-weight: 700; color: var(--text); }
.md :deep(blockquote) {
  border-left: 3px solid var(--copper);
  padding-left: 12px;
  color: var(--text-soft);
  margin: 8px 0;
}
.md :deep(a) { color: var(--copper); text-decoration: underline; }
</style>
