import type { Line } from '../data/bagua'
import { motion } from 'motion/react'
import { Fragment, type ReactNode } from 'react'

interface Props {
  lines: Line[] // 由下往上
  size?: number
  moving?: number // 1-based
  highlight?: number[] // 1-based
  labels?: boolean
  color?: string
  onLineClick?: (i: number) => void
  draw?: boolean
}

const EASE = [0.25, 0.8, 0.3, 1] as const

export function Hex({ lines, size = 64, moving, highlight = [], labels, color = 'var(--ink)', onLineClick, draw }: Props) {
  const n = lines.length
  const lh = size * 0.13
  const gap = size * 0.09
  const w = size
  const h = n * lh + (n - 1) * gap
  const lw = labels ? 34 : 0
  return (
    <svg width={w + lw} height={h} viewBox={`0 0 ${w + lw} ${h}`} role="img" aria-label="卦画" className="hex-svg">
      {lines.map((l, i) => {
        const y = h - (i + 1) * lh - i * gap
        const hl = highlight.includes(i + 1)
        const mv = moving === i + 1
        const fill = mv ? 'var(--cinnabar)' : hl ? 'var(--gold)' : color
        const click = onLineClick ? { onClick: () => onLineClick(i), style: { cursor: 'pointer' } } : {}
        return (
          <g key={i} {...click}>
            {onLineClick && <rect x={0} y={y - gap / 2} width={w} height={lh + gap} fill="transparent" />}
            {l === 1 ? (
              <Bar x={0} y={y} w={w} h={lh} fill={fill} draw={draw} />
            ) : (
              <>
                <Bar x={0} y={y} w={w * 0.43} h={lh} fill={fill} draw={draw} />
                <Bar x={w * 0.57} y={y} w={w * 0.43} h={lh} fill={fill} draw={draw} delay={0.22} />
              </>
            )}
            {mv && <circle cx={w + 8} cy={y + lh / 2} r={lh * 0.35} fill="var(--cinnabar)" />}
            {labels && (
              <text x={w + (mv ? 16 : 6)} y={y + lh * 0.85} fontSize={lh * 0.95} fill="var(--ink-soft)">
                {['初', '二', '三', '四', '五', '上'][i] ?? i + 1}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Bar({ x, y, w, h, fill, draw, delay = 0 }: { x: number; y: number; w: number; h: number; fill: string; draw?: boolean; delay?: number }) {
  if (!draw) return <rect x={x} y={y} width={w} height={h} rx={h * 0.18} fill={fill} />
  return (
    <motion.rect x={x} y={y} height={h} rx={h * 0.18} fill={fill}
      initial={{ width: 0, opacity: 0.4 }} animate={{ width: w, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: EASE }} />
  )
}

export function Rich({ text }: { text: string }) {
  return (
    <div className="rich">
      {text.split('\n').map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="sp" />
        ) : (
          <p key={i}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((seg, j): ReactNode =>
              seg.startsWith('**') ? <strong key={j}>{seg.slice(2, -2)}</strong> : <Fragment key={j}>{seg}</Fragment>,
            )}
          </p>
        ),
      )}
    </div>
  )
}
