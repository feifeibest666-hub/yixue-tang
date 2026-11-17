import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Hex } from './Hex'
import { HEXAGRAMS, type Line, hexByLines, trigramByLines } from '../data/bagua'
import { SCENE, TRIGRAM_SCENE, TRIGRAM_WHY } from '../data/scenes'

const SIXIANG: Record<string, { name: string; why: string }> = {
  '11': { name: '太阳', why: '下面阳、上面还是阳：阳一路延续到头，像盛夏。' },
  '10': { name: '少阴', why: '下面是阳、上面长出了阴：阳走到极点开始生出阴，像夏去秋来。' },
  '01': { name: '少阳', why: '下面是阴、上面长出了阳：阴里开始生出阳，像冬去春来。' },
  '00': { name: '太阴', why: '下面阴、上面还是阴：阴一路延续到头，像隆冬。' },
}

function LineButtons({ disabled, onAdd }: { disabled: boolean; onAdd: (l: Line) => void }) {
  return (
    <div className="stack-btns">
      <button className="btn yang" disabled={disabled} onClick={() => onAdd(1)}>
        <svg viewBox="0 0 40 8" className="line-ico"><rect width="40" height="8" rx="2" /></svg>阳
      </button>
      <button className="btn yin" disabled={disabled} onClick={() => onAdd(0)}>
        <svg viewBox="0 0 40 8" className="line-ico"><rect width="17" height="8" rx="2" /><rect x="23" width="17" height="8" rx="2" /></svg>阴
      </button>
    </div>
  )
}

export function YaoBrush() {
  const [yang, setYang] = useState(true)
  const [ink, setInk] = useState<{ id: number; x: number; y: number; r: number; gather: boolean }[]>([])
  const reduced = useReducedMotion()
  const toggle = () => {
    const next = !yang
    setYang(next)
    if (reduced) return
    const id = Date.now()
    setInk(Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4
      const d = 30 + Math.random() * 60
      return { id: id + i, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.55, r: 4 + Math.random() * 9, gather: next }
    }))
    setTimeout(() => setInk([]), 800)
  }
  return (
    <div className="fx-yao">
      <button className="yao-stage" onClick={toggle} aria-label="切换阴阳">
        <svg viewBox="0 0 240 46" className="yao-svg">
          {yang ? (
            <motion.rect key="yang" x="6" y="13" height="20" rx="6" fill="var(--ink)"
              initial={reduced ? { width: 228 } : { width: 0 }} animate={{ width: 228 }}
              transition={{ duration: 0.55, ease: [0.22, 0.7, 0.3, 1] }} />
          ) : (
            <>
              {[6, 132].map((x, i) => (
                <motion.rect key={`yin${i}`} x={x} y="13" height="20" rx="6" fill="var(--ink)"
                  initial={reduced ? { width: 102 } : { width: 0 }} animate={{ width: 102 }}
                  transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 0.7, 0.3, 1] }} />
              ))}
            </>
          )}
        </svg>
        {ink.map((d) => (
          <motion.i key={d.id} className={`ink-dot ${d.gather ? 'yang' : 'yin'}`} style={{ width: d.r, height: d.r, marginLeft: -d.r / 2, marginTop: -d.r / 2 }}
            initial={d.gather ? { x: d.x, y: d.y, opacity: 0, scale: 0.6 } : { x: 0, y: 0, opacity: 0.9, scale: 1.2 }}
            animate={d.gather ? { x: 0, y: 0, opacity: [0, 0.85, 0], scale: 1 } : { x: d.x, y: d.y, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.7, ease: d.gather ? 'easeIn' : 'easeOut' }} />
        ))}
      </button>
      <motion.div key={yang ? 'a' : 'b'} className="yao-caption" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <b>{yang ? '阳爻' : '阴爻'}</b>
        <span>{yang ? '墨聚成一笔：实而满，表示“是 · 动 · 刚”' : '中间散开留白：虚能容，表示“否 · 静 · 柔”'}</span>
      </motion.div>
      <div className="hint">点一下，看这一笔怎么变</div>
    </div>
  )
}

export function Taiji() {
  const reduced = useReducedMotion()
  return (
    <div className="fx-taiji">
      <motion.svg viewBox="-100 -100 200 200" className="taiji-svg" animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
        <circle r="96" fill="#f6f1e6" stroke="#1d1c1a" strokeWidth="3" />
        <path d="M0,-96 A96,96 0 0 1 0,96 A48,48 0 0 1 0,0 A48,48 0 0 0 0,-96 Z" fill="#1d1c1a" />
        <circle cy="-48" r="13" fill="#1d1c1a" />
        <circle cy="48" r="13" fill="#f6f1e6" />
      </motion.svg>
      <ul className="taiji-notes">
        <li>白为阳、黑为阴，各占一半，谁也少不了谁。</li>
        <li>一头细一头粗：一边增长时，另一边在减少。</li>
        <li>白最多处有个黑点，黑最多处有个白点：盛到极点，反面已经萌芽。</li>
        <li>分界是 S 形曲线：转化是慢慢过渡的，不是一刀切。</li>
      </ul>
    </div>
  )
}

export function SixiangScene() {
  const [lines, setLines] = useState<Line[]>([])
  const key = lines.length === 2 ? lines.join('') : ''
  const info = key ? SIXIANG[key] : undefined
  return (
    <div className="fx-stack">
      <div className="stack-stage">
        {lines.length === 0 ? <div className="stack-empty">先放最下面那条</div> : <Hex lines={lines} size={150} highlight={[lines.length]} draw />}
        {info && (
          <motion.div key={key} className="stack-info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="stack-name">{info.name}</div>
            <div>{info.why}</div>
          </motion.div>
        )}
      </div>
      <LineButtons disabled={lines.length === 2} onAdd={(l) => setLines([...lines, l])} />
      <div className="row-end">
        <button className="btn ghost sm" disabled={!lines.length} onClick={() => setLines(lines.slice(0, -1))}>撤销</button>
        <button className="btn ghost sm" disabled={!lines.length} onClick={() => setLines([])}>重来</button>
      </div>
      <div className="sx-grid">
        {Object.entries(SIXIANG).map(([k, v]) => (
          <div key={k} className={`sx-cell ${key === k ? 'on' : ''}`}>
            <Hex lines={k.split('').map(Number) as Line[]} size={34} />
            <b>{v.name}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCENE_MOTION: Record<string, { animate: Record<string, number[]>; transition: Record<string, unknown> }> = {
  乾: { animate: { scale: [1.08, 1], filter: [0.6, 1] }, transition: { duration: 2.4, ease: 'easeOut' } },
  坤: { animate: { scale: [1.12, 1.02] }, transition: { duration: 3.2, ease: 'easeOut' } },
  震: { animate: { opacity: [0, 1, 0.2, 1, 0.5, 1] }, transition: { duration: 1.1, times: [0, 0.1, 0.18, 0.3, 0.4, 1] } },
  艮: { animate: { y: [36, 0], scale: [1.04, 1] }, transition: { duration: 1.8, ease: [0.2, 0.7, 0.2, 1] } },
  坎: { animate: { x: [-18, 0, -10], scale: [1.1, 1.1, 1.1] }, transition: { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } },
  离: { animate: { scale: [1.04, 1.07, 1.04], filter: [1, 1.12, 1] }, transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
  巽: { animate: { x: [24, -12], scale: [1.12, 1.12] }, transition: { duration: 5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } },
  兑: { animate: { scale: [1.02, 1.05, 1.02] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
}

function SceneImage({ name }: { name: string }) {
  const reduced = useReducedMotion()
  const m = SCENE_MOTION[name]
  const { filter, ...rest } = m.animate
  const animate = filter ? { ...rest, filter: filter.map((b) => `brightness(${b})`) } : rest
  return (
    <motion.div className="scene-reveal" initial={reduced ? { opacity: 0 } : { clipPath: 'circle(0% at 50% 62%)', opacity: 1 }}
      animate={reduced ? { opacity: 1 } : { clipPath: 'circle(80% at 50% 62%)' }} transition={{ duration: 1.1, ease: [0.3, 0.6, 0.2, 1] }}>
      <motion.img src={SCENE[TRIGRAM_SCENE[name]]} alt="" animate={reduced ? undefined : animate} transition={m.transition} />
      {name === '震' && !reduced && (
        <motion.div className="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0, 0.6, 0] }} transition={{ duration: 0.9, delay: 0.25 }} />
      )}
    </motion.div>
  )
}

export function TrigramScene() {
  const [lines, setLines] = useState<Line[]>([])
  const tri = lines.length === 3 ? trigramByLines(lines) : undefined
  const pos = ['地', '人', '天']
  return (
    <div className="fx-stack">
      <div className={`scene-frame ${tri ? 'show' : ''}`}>
        {tri && <SceneImage key={tri.name} name={tri.name} />}
        <div className="scene-pos">{pos.slice().reverse().map((p, i) => <span key={p} className={lines.length > 2 - i ? 'on' : ''}>{p}</span>)}</div>
        <div className="scene-hex">
          {lines.length > 0 ? <Hex lines={lines} size={112} color={tri ? '#f7f2e7' : 'var(--ink)'} highlight={tri ? [] : [lines.length]} draw /> : <div className="stack-empty">先放最下面那条：地</div>}
        </div>
        {tri && (
          <motion.div className="scene-name" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <b>{tri.name}</b><span>{tri.nature}</span>
          </motion.div>
        )}
      </div>
      {tri ? (
        <motion.div key={tri.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="scene-why">
          <div><b>为什么是{tri.nature}？</b><span>{TRIGRAM_WHY[tri.name]}</span></div>
        </motion.div>
      ) : <div className="hint">从下往上叠三条。下为地、中为人、上为天。</div>}
      <LineButtons disabled={lines.length === 3} onAdd={(l) => setLines([...lines, l])} />
      <div className="row-end">
        <button className="btn ghost sm" disabled={!lines.length} onClick={() => setLines(lines.slice(0, -1))}>撤销</button>
        <button className="btn ghost sm" disabled={!lines.length} onClick={() => setLines([])}>重来</button>
      </div>
    </div>
  )
}

const PARTICLES = Array.from({ length: 9 }, (_, i) => ({ x: 26 + (i % 5) * 22 + (i > 4 ? 11 : 0), d: (i * 0.37) % 2.2 }))

function QiColumn({ kind }: { kind: 'tai' | 'pi' }) {
  const reduced = useReducedMotion()
  const g = kind === 'tai' ? HEXAGRAMS[10] : HEXAGRAMS[11]
  const up = g.upper.lines
  const lo = g.lower.lines
  const tri = (ls: Line[], y0: number, color: string) =>
    ls.slice().reverse().map((l, i) => {
      const y = y0 + i * 11
      return l ? <rect key={i} x="35" y={y} width="80" height="6" rx="1" fill={color} />
        : <g key={i}><rect x="35" y={y} width="35" height="6" rx="1" fill={color} /><rect x="80" y={y} width="35" height="6" rx="1" fill={color} /></g>
    })
  const skyColor = 'var(--qing)'
  const earthColor = 'var(--ochre)'
  const upperIsEarth = kind === 'tai'
  const topColor = upperIsEarth ? earthColor : skyColor
  const botColor = upperIsEarth ? skyColor : earthColor
  // 泰：上方地气下沉、下方天气上升，会于中；否：上方天气更上、下方地气更下，中间空
  const topPath = kind === 'tai' ? [62, 112] : [56, 6]
  const botPath = kind === 'tai' ? [172, 122] : [178, 228]
  return (
    <svg viewBox="0 0 150 240" className="qi-svg">
      <text x="75" y="14" textAnchor="middle" className="qi-label">上卦 · {g.upper.nature}</text>
      <g>{tri(up, 22, topColor)}</g>
      <g>{tri(lo, 196, botColor)}</g>
      <text x="75" y="236" textAnchor="middle" className="qi-label">下卦 · {g.lower.nature}</text>
      {kind === 'tai' ? (
        <motion.circle cx="75" cy="117" r="20" fill="url(#qiGlow)" animate={reduced ? undefined : { r: [14, 24, 14], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <line x1="20" x2="130" y1="117" y2="117" stroke="var(--ink-faint)" strokeDasharray="3 5" />
      )}
      {PARTICLES.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} r="3.2" fill={topColor}
            initial={{ cy: topPath[0], opacity: 0 }}
            animate={reduced ? { cy: (topPath[0] + topPath[1]) / 2, opacity: 0.8 } : { cy: topPath, opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.2, delay: p.d, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx={150 - p.x} r="3.2" fill={botColor}
            initial={{ cy: botPath[0], opacity: 0 }}
            animate={reduced ? { cy: (botPath[0] + botPath[1]) / 2, opacity: 0.8 } : { cy: botPath, opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.2, delay: p.d + 0.3, repeat: Infinity, ease: 'easeInOut' }} />
        </g>
      ))}
      <text x="75" y="122" textAnchor="middle" className={`qi-mid ${kind}`}>{kind === 'tai' ? '交' : '隔'}</text>
    </svg>
  )
}

export function TaiPi() {
  return (
    <div className="fx-taipi">
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <defs>
          <radialGradient id="qiGlow"><stop offset="0" stopColor="var(--gold)" stopOpacity="0.55" /><stop offset="1" stopColor="var(--gold)" stopOpacity="0" /></radialGradient>
        </defs>
      </svg>
      <div className="tp-col ok">
        <QiColumn kind="tai" />
        <b>地天泰 · 通</b>
        <p>地在上，地气本性下沉；天在下，天气本性上升。两股气相向而行，在中间相遇，所以“通”。</p>
      </div>
      <div className="tp-col bad">
        <QiColumn kind="pi" />
        <b>天地否 · 塞</b>
        <p>天在上还往上走，地在下还往下沉。看着“各安其位”，其实越离越远，所以“塞”。</p>
      </div>
    </div>
  )
}

function CoinFace({ side }: { side: 'yang' | 'yin' }) {
  return (
    <svg viewBox="-50 -50 100 100" className={`coin-face ${side}`}>
      <circle r="47" className="cf-rim" />
      <circle r="40" className="cf-field" />
      <rect x="-11" y="-11" width="22" height="22" className="cf-hole" />
      {side === 'yang' ? (
        <g className="cf-txt">
          <text y="-20">周</text><text y="34">易</text><text x="27" y="7">通</text><text x="-27" y="7">宝</text>
        </g>
      ) : (
        <g className="cf-mark">
          <path d="M-6 -30 a12 12 0 1 0 12 0 a9 9 0 1 1 -12 0z" />
          <circle cy="27" r="3.2" />
        </g>
      )}
    </svg>
  )
}

export function CoinCast({ count }: { count: 3 | 6 }) {
  const reduced = useReducedMotion()
  const [lines, setLines] = useState<Line[]>([])
  const [spinning, setSpinning] = useState(false)
  const [turns, setTurns] = useState(0)
  const [face, setFace] = useState<Line>(1)
  const done = lines.length === count
  const toss = () => {
    if (spinning || done) return
    const result: Line = Math.random() < 0.5 ? 1 : 0
    setFace(result)
    if (reduced) { setLines([...lines, result]); return }
    setTurns(turns + 4)
    setSpinning(true)
    setTimeout(() => { setSpinning(false); setLines([...lines, result]) }, 1050)
  }
  const tri = count === 3 && done ? trigramByLines(lines) : undefined
  const hex = count === 6 && done ? hexByLines(lines) : undefined
  return (
    <div className="fx-coin">
      <div className="coin-stage">
        <motion.button className="coin" onClick={toss} disabled={done} aria-label="扔硬币"
          style={{ transformPerspective: 600 }}
          animate={{ rotateX: turns * 360, y: spinning ? [0, -78, 0] : 0 }}
          transition={{ rotateX: { duration: reduced ? 0 : 1, ease: [0.3, 0.1, 0.25, 1] }, y: { duration: 1, ease: [0.3, 0, 0.4, 1], times: [0, 0.45, 1] } }}>
          <CoinFace side={face ? 'yang' : 'yin'} />
        </motion.button>
        {lines.length > 0 && !spinning && (
          <motion.div key={lines.length} className="coin-cap" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            {face ? '正面 · 阳' : '反面 · 阴'}
          </motion.div>
        )}
        <motion.div className="coin-shadow" animate={{ scale: spinning ? [1, 0.55, 1] : 1, opacity: spinning ? [0.35, 0.15, 0.35] : 0.35 }} transition={{ duration: 1 }} />
      </div>
      <div className="coin-lines">
        {lines.length === 0 ? <div className="stack-empty">点铜钱掷一次：有字的正面为阳，光背的反面为阴</div> : <Hex lines={lines} size={96} highlight={done ? [] : [lines.length]} draw />}
        <div className="coin-count">{done ? `已掷 ${count} 次` : `第 ${lines.length + 1} 掷 / 共 ${count} 掷`}</div>
      </div>
      {tri && (
        <motion.div className="scene-why with-img" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <img src={SCENE[TRIGRAM_SCENE[tri.name]]} alt="" />
          <div><b>{tri.name} · {tri.nature}</b><span>{TRIGRAM_WHY[tri.name]}</span></div>
        </motion.div>
      )}
      {hex && (
        <motion.a className="coin-result" href={`#/atlas/${hex.n}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <b>{hex.fullName}</b>
          <span>下卦 {hex.lower.name}（{hex.lower.nature}）· 上卦 {hex.upper.name}（{hex.upper.nature}）· 第 {hex.n} 卦</span>
        </motion.a>
      )}
      <div className="row-end">
        <button className="btn ghost sm" disabled={!lines.length || spinning} onClick={() => { setLines([]); setFace(1) }}>重来</button>
      </div>
    </div>
  )
}

const ORDER = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']

export function LookupTable() {
  const [sel, setSel] = useState<number | null>(null)
  const h = sel ? HEXAGRAMS[sel - 1] : undefined
  return (
    <div className="fx-lookup">
      <div className="lk-scroll">
        <table>
          <thead>
            <tr><th>下＼上</th>{ORDER.map((n) => <th key={n}>{n}</th>)}</tr>
          </thead>
          <tbody>
            {ORDER.map((lo) => (
              <tr key={lo}>
                <th>{lo}</th>
                {ORDER.map((up) => {
                  const g = HEXAGRAMS.find((x) => x.lower.name === lo && x.upper.name === up)!
                  return <td key={up} className={sel === g.n ? 'on' : ''} onClick={() => setSel(g.n)}>{g.name}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {h && <a className="coin-result" href={`#/atlas/${h.n}`}><b>{h.fullName}</b><span>第 {h.n} 卦 · {h.gist}</span></a>}
      <div className="hint">行是下卦，列是上卦。点一格看全名。</div>
    </div>
  )
}
