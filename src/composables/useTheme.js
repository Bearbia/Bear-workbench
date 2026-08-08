import { ref, watch } from 'vue'

const STORAGE_KEY = 'workbench-theme'
const theme = ref(localStorage.getItem(STORAGE_KEY) || 'light')

function apply(val) {
  document.documentElement.setAttribute('data-theme', val)
  localStorage.setItem(STORAGE_KEY, val)
}

apply(theme.value)

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  watch(theme, apply)
  return { theme, toggle }
}
