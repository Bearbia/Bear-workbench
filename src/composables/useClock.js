import { ref, onMounted, onUnmounted } from 'vue'

export function useClock() {
  const now = ref(new Date())
  let timer = null

  onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
  onUnmounted(() => { clearInterval(timer) })

  function pad(n) { return String(n).padStart(2, '0') }

  const timeStr = () => `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}:${pad(now.value.getSeconds())}`

  const dateStr = () => {
    const d = now.value
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
  }

  const greeting = () => {
    const h = now.value.getHours()
    if (h < 6) return '夜深了，注意休息'
    if (h < 12) return '早上好，新的一天开始了'
    if (h < 14) return '中午好，午间小憩一下'
    if (h < 18) return '下午好，继续专注工作'
    if (h < 22) return '晚上好，今日辛苦了'
    return '夜深了，注意休息'
  }

  return { now, timeStr, dateStr, greeting }
}
