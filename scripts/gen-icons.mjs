/**
 * 生成 PWA 所需的 PNG 图标（纯 Node 实现，无需外部依赖）
 * 设计：棕铜工坊风 — 棕色圆角背景 + 黄铜边框 + 中心黄铜圆环
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public')

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // 每行前加 filter byte (0 = none)
  const stride = width * 4
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------- 颜色 ----------
function hexRGB(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
const C_BG = hexRGB('#3d2b1f')
const C_BG2 = hexRGB('#4a3424')
const C_BORDER = hexRGB('#c9a961')
const C_RING = hexRGB('#d4b878')
const C_INNER = hexRGB('#935542')

function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] }
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))) }

// ---------- 绘制 ----------
function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const cx = size / 2, cy = size / 2
  // 圆角半径：maskable 时不用圆角（安全区），普通用 18% 圆角
  const cornerR = maskable ? 0 : size * 0.18
  const borderInset = maskable ? size * 0.12 : size * 0.09
  const ringR = size * (maskable ? 0.26 : 0.28)
  const ringW = Math.max(2, size * 0.022)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      // 圆角判定
      let inside = true
      if (cornerR > 0) {
        const dx = Math.max(0, Math.max(x - (size - 1 - cornerR), cornerR - x))
        const dy = Math.max(0, Math.max(y - (size - 1 - cornerR), cornerR - y))
        if (dx * dx + dy * dy > cornerR * cornerR) inside = false
      }

      if (!inside) {
        // 透明
        rgba[i] = 0; rgba[i + 1] = 0; rgba[i + 2] = 0; rgba[i + 3] = 0
        continue
      }

      // 背景渐变（左上→右下）
      const gt = (x + y) / (2 * size)
      const bg = mix(C_BG, C_BG2, gt * 0.6)

      let [r, g, b] = bg

      // 黄铜外边框
      const bx0 = borderInset, by0 = borderInset
      const bx1 = size - borderInset, by1 = size - borderInset
      const bw = Math.max(2, size * 0.016)
      const onBorder =
        (x >= bx0 && x < bx0 + bw && y >= by0 && y < by1) ||
        (x < bx1 && x >= bx1 - bw && y >= by0 && y < by1) ||
        (y >= by0 && y < by0 + bw && x >= bx0 && x < bx1) ||
        (y < by1 && y >= by1 - bw && x >= bx0 && x < bx1)
      if (onBorder) { r = C_BORDER[0]; g = C_BORDER[1]; b = C_BORDER[2] }

      // 中心铜环
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (Math.abs(dist - ringR) < ringW) {
        const c = mix(C_RING, C_BORDER, 0.3)
        r = c[0]; g = c[1]; b = c[2]
      } else if (dist < ringR - ringW) {
        // 内圈铜色填充
        const t = dist / (ringR - ringW)
        const c = mix(C_INNER, C_BG2, t * 0.5)
        r = c[0]; g = c[1]; b = c[2]
      }

      rgba[i] = clamp(r)
      rgba[i + 1] = clamp(g)
      rgba[i + 2] = clamp(b)
      rgba[i + 3] = 255
    }
  }
  return rgba
}

// ---------- 输出 ----------
mkdirSync(outDir, { recursive: true })
const sizes = [192, 512]
for (const s of sizes) {
  const png = encodePNG(s, s, drawIcon(s, {}))
  writeFileSync(join(outDir, `pwa-${s}.png`), png)
  console.log(`✓ pwa-${s}.png`)
}
// maskable 512
const maskPng = encodePNG(512, 512, drawIcon(512, { maskable: true }))
writeFileSync(join(outDir, 'pwa-maskable-512.png'), maskPng)
console.log('✓ pwa-maskable-512.png')
// apple-touch-icon 180
const applePng = encodePNG(180, 180, drawIcon(180, {}))
writeFileSync(join(outDir, 'apple-touch-icon.png'), applePng)
console.log('✓ apple-touch-icon.png')
console.log('PWA 图标生成完成')
