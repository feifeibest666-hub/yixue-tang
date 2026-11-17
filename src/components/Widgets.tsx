import { useMemo, useState } from 'react'
import { Hex } from './Hex'
import { MeihuaResultView } from './MeihuaResultView'
import { CoinCast, LookupTable, SixiangScene, TaiPi, Taiji, TrigramScene, YaoBrush } from './fx'
import {
  HEXAGRAMS, TRIGRAMS, type Line, type Trigram, hexByLines, hexByTrigrams, trigramByLines, yaoTitle, YAO_POS,
} from '../data/bagua'
import type { WidgetName } from '../data/curriculum'
import { castByNumber } from '../lib/meihua'

export function Widget({ name }: { name: WidgetName }) {
  switch (name) {
    case 'yinyangSort': return <YinYangSort />
    case 'taiji': return <Taiji />
    case 'yaoBrush': return <YaoBrush />
    case 'sixiangScene': return <SixiangScene />
    case 'trigramScene': return <TrigramScene />
    case 'taipi': return <TaiPi />
    case 'coin3': return <CoinCast count={3} />
    case 'coin6': return <CoinCast count={6} />
    case 'lookup': return <LookupTable />
    case 'trigramCards': return <TrigramCards />
    case 'trigramExplorer': return <TrigramExplorer />
    case 'xiantianMap': return <BaguaMap initial="xian" />
    case 'houtianMap': return <BaguaMap initial="hou" />
    case 'wuxingCycle': return <WuxingCycle />
    case 'hexBuilder': return <HexBuilder />
    case 'yaoPosition': return <YaoPosition />
    case 'huBian': return <HuBian />
    case 'meihuaNumber': return <MeihuaNumber />
  }
}

// ── 阴阳分类 ──
const YY_ITEMS: { w: string; a: '阳' | '阴'; why: string }[] = [
  { w: '☀️ 白天', a: '阳', why: '亮、热、人在活动' },
  { w: '🌙 黑夜', a: '阴', why: '暗、凉、人在休息' },
  { w: '🔥 火', a: '阳', why: '热、向上' },
  { w: '💧 冰水', a: '阴', why: '冷、向下、静' },
  { w: '🏃 奔跑', a: '阳', why: '动' },
  { w: '😴 睡觉', a: '阴', why: '静' },
  { w: '⛰️ 山的向阳面', a: '阳', why: '“阳”字本义就是山的南面、向阳面' },
  { w: '🌳 树荫下', a: '阴', why: '背光、凉' },
  { w: '📢 大声说话', a: '阳', why: '向外、发散' },
  { w: '🤫 安静思考', a: '阴', why: '向内、收敛' },
]
function YinYangSort() {
  const [ans, setAns] = useState<Record<number, '阳' | '阴'>>({})
  const right = YY_ITEMS.filter((it, i) => ans[i] === it.a).length
  return (
    <div className="w-yy">
      {YY_ITEMS.map((it, i) => (
        <div key={i} className={`yy-row ${ans[i] ? (ans[i] === it.a ? 'ok' : 'bad') : ''}`}>
          <span className="yy-w">{it.w}</span>
          <div className="yy-btns">
            {(['阳', '阴'] as const).map((v) => (
              <button key={v} className={`chip ${ans[i] === v ? 'on' : ''} ${v === '阳' ? 'yang' : 'yin'}`} onClick={() => setAns({ ...ans, [i]: v })}>{v}</button>
            ))}
          </div>
          {ans[i] && <div className="yy-why">{ans[i] === it.a ? '✓ ' : `✗ 应为${it.a}：`}{it.why}</div>}
        </div>
      ))}
      <div className="w-foot">已答对 {right} / {YY_ITEMS.length}</div>
    </div>
  )
}

// ── 八卦翻卡 ──
function TrigramCards() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  return (
    <div className="tri-flip">
      {TRIGRAMS.map((t) => (
        <button key={t.name} className={`flip ${open[t.name] ? 'open' : ''}`} onClick={() => setOpen({ ...open, [t.name]: !open[t.name] })}>
          <Hex lines={t.lines} size={54} />
          {open[t.name] ? <div className="flip-back"><b>{t.name}</b>·{t.nature}<small>{t.mnemonic}</small></div> : <div className="flip-q">？</div>}
        </button>
      ))}
    </div>
  )
}

export function TrigramExplorer() {
  const [sel, setSel] = useState<Trigram>(TRIGRAMS[0])
  return (
    <div className="tri-ex">
      <div className="tri-grid">
        {TRIGRAMS.map((t) => (
          <button key={t.name} className={`tri-tile ${sel === t ? 'on' : ''}`} onClick={() => setSel(t)}>
            <Hex lines={t.lines} size={40} />
            <span>{t.name}</span>
          </button>
        ))}
      </div>
      <table className="tri-table">
        <tbody>
          <tr><th>卦名</th><td><b className="big">{sel.name}</b> {sel.symbol} · {sel.mnemonic}</td></tr>
          <tr><th>自然 / 性情</th><td>{sel.nature} / {sel.trait}</td></tr>
          <tr><th>先天数</th><td>{sel.xiantianNum}</td></tr>
          <tr><th>五行</th><td>{sel.wuxing}</td></tr>
          <tr><th>先天方位</th><td>{sel.xiantianDir}</td></tr>
          <tr><th>后天方位</th><td>{sel.houtianDir}</td></tr>
          <tr><th>家人</th><td>{sel.family}</td></tr>
          <tr><th>身体</th><td>{sel.body}</td></tr>
          <tr><th>动物</th><td>{sel.animal}</td></tr>
          <tr><th>更多类象</th><td>{sel.more}</td></tr>
        </tbody>
      </table>
    </div>
  )
}

// ── 八卦方位图（上南下北，左东右西） ──
const DIR_POS: Record<string, [number, number]> = {
  南: [0, -1], 西南: [0.707, -0.707], 西: [1, 0], 西北: [0.707, 0.707], 北: [0, 1], 东北: [-0.707, 0.707], 东: [-1, 0], 东南: [-0.707, -0.707],
}
export function BaguaMap({ initial }: { initial: 'xian' | 'hou' }) {
  const [mode, setMode] = useState(initial)
  const R = 112
  return (
    <div className="w-map">
      <div className="seg">
        <button className={mode === 'xian' ? 'on' : ''} onClick={() => setMode('xian')}>先天（伏羲）</button>
        <button className={mode === 'hou' ? 'on' : ''} onClick={() => setMode('hou')}>后天（文王）</button>
      </div>
      <svg viewBox="-160 -160 320 320" className="map-svg">
        <circle r={145} fill="none" stroke="var(--line)" />
        <circle r={74} fill="none" stroke="var(--line)" strokeDasharray="3 4" />
        <text y={8} textAnchor="middle" fontSize={26} fill="var(--ink-soft)">☯</text>
        {TRIGRAMS.map((t) => {
          const dir = mode === 'xian' ? t.xiantianDir : t.houtianDir
          const [x, y] = DIR_POS[dir]
          return (
            <g key={t.name} transform={`translate(${x * R},${y * R})`}>
              <text y={-22} textAnchor="middle" fontSize={11} fill="var(--ink-soft)">{dir}</text>
              <g transform="translate(-16,-14)"><Hex lines={t.lines} size={32} /></g>
              <text y={28} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">{t.name}{mode === 'xian' ? t.xiantianNum : ''}</text>
            </g>
          )
        })}
      </svg>
      <div className="hint">中式图：上南下北、左东右西。{mode === 'xian' ? '数字为先天数。' : '后天八卦配四季：震春、离夏、兑秋、坎冬。'}</div>
    </div>
  )
}

// ── 五行生克 ──
const WX = ['木', '火', '土', '金', '水'] as const
const WX_COLOR: Record<string, string> = { 木: '#4f7a4a', 火: '#b23a2b', 土: '#a07a3c', 金: '#8a8a8a', 水: '#2f4f6f' }
function WuxingCycle() {
  const [mode, setMode] = useState<'sheng' | 'ke'>('sheng')
  const R = 100
  const pts = WX.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return [Math.cos(a) * R, Math.sin(a) * R]
  })
  const edges = WX.map((_, i) => [i, mode === 'sheng' ? (i + 1) % 5 : (i + 2) % 5])
  return (
    <div className="w-wx">
      <div className="seg">
        <button className={mode === 'sheng' ? 'on' : ''} onClick={() => setMode('sheng')}>相生</button>
        <button className={mode === 'ke' ? 'on' : ''} onClick={() => setMode('ke')}>相克</button>
      </div>
      <svg viewBox="-140 -135 280 270" className="map-svg">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={mode === 'sheng' ? 'var(--jade)' : 'var(--cinnabar)'} />
          </marker>
        </defs>
        {edges.map(([a, b]) => {
          const [x1, y1] = pts[a], [x2, y2] = pts[b]
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
          const s = 30 / len
          return <line key={`${a}${b}`} x1={x1 + dx * s} y1={y1 + dy * s} x2={x2 - dx * s} y2={y2 - dy * s} stroke={mode === 'sheng' ? 'var(--jade)' : 'var(--cinnabar)'} strokeWidth={2.2} markerEnd="url(#arr)" />
        })}
        {WX.map((w, i) => (
          <g key={w} transform={`translate(${pts[i][0]},${pts[i][1]})`}>
            <circle r={24} fill={WX_COLOR[w]} />
            <text y={8} textAnchor="middle" fontSize={22} fill="#fff" fontWeight={700}>{w}</text>
          </g>
        ))}
      </svg>
      <div className="hint">{mode === 'sheng' ? '木生火 → 火生土 → 土生金 → 金生水 → 水生木' : '木克土 → 土克水 → 水克火 → 火克金 → 金克木'}</div>
    </div>
  )
}

// ── 拼卦 ──
function HexBuilder() {
  const [up, setUp] = useState(TRIGRAMS[7])
  const [lo, setLo] = useState(TRIGRAMS[0])
  const h = hexByTrigrams(lo, up)
  const pick = (cur: Trigram, set: (t: Trigram) => void) => (
    <div className="pick-row">
      {TRIGRAMS.map((t) => (
        <button key={t.name} className={`pick ${cur === t ? 'on' : ''}`} onClick={() => set(t)}>{t.symbol}<small>{t.name}</small></button>
      ))}
    </div>
  )
  return (
    <div className="w-build">
      <div className="lbl">上卦（外卦）</div>{pick(up, setUp)}
      <div className="lbl">下卦（内卦）</div>{pick(lo, setLo)}
      <a className="build-out" href={`#/atlas/${h.n}`}>
        <Hex lines={h.lines} size={80} highlight={[4, 5, 6]} />
        <div>
          <div className="big">{h.name}</div>
          <div>{h.fullName} · 第 {h.n} 卦</div>
          <div className="muted">{h.gist}</div>
        </div>
      </a>
    </div>
  )
}

// ── 爻位 ──
function YaoPosition() {
  const samples = [63, 64, 3, 1]
  const [n, setN] = useState(63)
  const [sel, setSel] = useState(4)
  const h = HEXAGRAMS[n - 1]
  const l = h.lines[sel]
  const isYangPos = sel % 2 === 0
  const proper = (l === 1) === isYangPos
  const pair = [3, 4, 5, 0, 1, 2][sel]
  const hasYing = h.lines[pair] !== l
  return (
    <div className="w-pos">
      <div className="seg">
        {samples.map((s) => <button key={s} className={n === s ? 'on' : ''} onClick={() => setN(s)}>{HEXAGRAMS[s - 1].name}</button>)}
      </div>
      <div className="pos-body">
        <Hex lines={h.lines} size={110} labels highlight={[sel + 1]} onLineClick={setSel} />
        <ul className="pos-info">
          <li>爻位：<b>{YAO_POS[sel]}</b>（从下往上第 {sel + 1} 爻）</li>
          <li>爻题：<b>{yaoTitle(sel, l)}</b>（{l ? '阳爻称九' : '阴爻称六'}）</li>
          <li>{isYangPos ? '阳位' : '阴位'} · {proper ? '当位 ✓' : '不当位'}</li>
          <li>{sel === 1 || sel === 4 ? '居中 ✓' : '不居中'}</li>
          <li>与{YAO_POS[pair]}爻相应：{hasYing ? '一阴一阳，有应 ✓' : '同性，无应'}</li>
          <li>三才：{sel < 2 ? '地' : sel < 4 ? '人' : '天'}</li>
        </ul>
      </div>
      <div className="hint">👆 点击任意一爻</div>
    </div>
  )
}

// ── 互卦变卦演示 ──
export function HuBian() {
  const [n, setN] = useState(49)
  const [mv, setMv] = useState(1)
  const ben = HEXAGRAMS[n - 1]
  const { hu, bian, huLo, huUp } = useMemo(() => {
    const huLo = trigramByLines(ben.lines.slice(1, 4))
    const huUp = trigramByLines(ben.lines.slice(2, 5))
    const bl = ben.lines.slice() as Line[]
    bl[mv - 1] = (1 - bl[mv - 1]) as Line
    return { hu: hexByTrigrams(huLo, huUp), bian: hexByLines(bl), huLo, huUp }
  }, [ben, mv])
  return (
    <div className="w-hb">
      <div className="hb-ctl">
        <select value={n} onChange={(e) => setN(Number(e.target.value))}>
          {HEXAGRAMS.map((h) => <option key={h.n} value={h.n}>{h.n}. {h.name}（{h.fullName}）</option>)}
        </select>
        <div className="seg small">
          {[1, 2, 3, 4, 5, 6].map((k) => <button key={k} className={mv === k ? 'on' : ''} onClick={() => setMv(k)}>{YAO_POS[k - 1]}</button>)}
        </div>
      </div>
      <div className="hb-row">
        <div className="hb-col"><div className="k">本卦</div><Hex lines={ben.lines} size={64} moving={mv} highlight={[2, 3, 4, 5]} /><b>{ben.name}</b></div>
        <div className="hb-col"><div className="k">互卦</div><Hex lines={hu.lines} size={64} /><b>{hu.name}</b></div>
        <div className="hb-col"><div className="k">变卦</div><Hex lines={bian.lines} size={64} highlight={[mv]} /><b>{bian.name}</b></div>
      </div>
      <ol className="hb-steps">
        <li>本卦第 2、3、4 爻 → {huLo.name}（互卦下卦）</li>
        <li>本卦第 3、4、5 爻 → {huUp.name}（互卦上卦）→ 互卦 {hu.fullName}</li>
        <li>第 {mv} 爻动（{yaoTitle(mv - 1, ben.lines[mv - 1])}），{ben.lines[mv - 1] ? '阳变阴' : '阴变阳'} → 变卦 {bian.fullName}</li>
      </ol>
    </div>
  )
}

// ── 数字起卦练习 ──
function MeihuaNumber() {
  const [a, setA] = useState('34')
  const [b, setB] = useState('43')
  const na = parseInt(a, 10), nb = parseInt(b, 10)
  const ok = na > 0 && nb > 0
  const r = ok ? castByNumber(na, nb, false) : null
  return (
    <div className="w-mh">
      <div className="num-row">
        <label>前数<input inputMode="numeric" value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <label>后数<input inputMode="numeric" value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
      </div>
      {r ? <MeihuaResultView r={r} compact /> : <div className="hint">请输入两个正整数</div>}
    </div>
  )
}
