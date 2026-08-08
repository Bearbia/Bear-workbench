<script setup>
import { watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

function close() { emit('update:modelValue', false) }

watch(() => props.modelValue, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-mask" @click.self="close">
        <div class="modal-panel scale-in">
          <div class="modal-head">
            <h3>{{ title }}</h3>
            <button class="btn-icon" @click="close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.foot" class="modal-foot">
            <slot name="foot" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed; inset: 0;
  background: rgba(42, 31, 23, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--parchment-dark), transparent);
}
.modal-head h3 { font-size: 18px; }
.modal-body { padding: 22px; overflow-y: auto; }
.modal-foot {
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 10px;
  background: var(--parchment-dark);
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal-panel, .modal-leave-active .modal-panel { transition: transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel, .modal-leave-to .modal-panel { transform: scale(0.92) translateY(10px); }
</style>
