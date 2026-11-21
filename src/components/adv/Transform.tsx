import { useMemo, useState } from 'react'
import { Hex } from '../Hex'
import { HEXAGRAMS, YAO_POS, hexByLines, trigramByLines, yaoTitle, type Line } from '../../data/bagua'

const ENDS = new Set(['乾', '坤', '既济', '未济'])

function huOf(lines: Line[]): Line[] {
  return [...trigramByLines(lines.slice(1, 4)).lines, ...trigramByLines(lines.slice(2, 5)).lines]
}

export default function Transform() {
  const [n, setN] = useState(11)
  const ben = HEXAGRAMS[n - 1]
  const lines = ben.lines as Line[]
  const cuo = lines.map((l) => (l === 1 ? 0 : 1)) as Line[]
  const zong = [...lines].reverse() as Line[]
  const hu = huOf(lines)
  const huhu = huOf(hu)
  const chain = useMemo(() => {
    const out: { name: string; lines: Line[] }[] = []
    let cur = lines
    const seen = new Set<string>()
    for (let i = 0; i < 8; i++) {
      const key = cur.join('')
      if (seen.has(key)) break
      seen.add(key)
      const hex = hexByLines(cur)
      out.push({ name: hex.name, lines: cur })
      if (i > 0 && ENDS.has(hex.name)) break
      const next = huOf(cur)
      if (next.join('') === key) break
      cur = next
    }
    return out
  }, [lines])
  const last = chain[chain.length - 1]
  const lastHu = huOf(last.lines).join('')
  const note = last.name === '乾' || last.name === '坤'
    ? `${last.name}再取互卦，还是自己。`
    : last.name === '既济' || last.name === '未济'
      ? '既济和未济互相是对方的互卦，再互就在这两卦之间打转。'
      : lastHu === last.lines.join('') ? '再互仍是这一卦。' : ''
  return (
    <div className="adv" data-widget="transform">
      <select value={n} onChange={(e) => setN(Number(e.target.value))}>
        {HEXAGRAMS.map((h) => <option key={h.n} value={h.n}>{h.n}. {h.name}（{h.fullName}）</option>)}
      </select>
      <div className="quad">
        {[['错', cuo, '六爻全翻'], ['综', zong, '上下颠倒'], ['互', hu, '取二三四、三四五'], ['互之互', huhu, '把互卦再互一次']].map(([title, ls, why]) => {
          const hex = hexByLines(ls as Line[])
          return (
            <div key={title as string}>
              <Hex lines={ls as Line[]} size={52} />
              <b>{title as string} · {hex.name}</b>
              <small>{why as string}</small>
            </div>
          )
        })}
      </div>
      <div className="chain-line">
        {chain.map((step, i) => <span key={i}>{i ? ' → ' : ''}{step.name}</span>)}
      </div>
      {note && <p className="hint">{note}反复取互，最后只会停在乾、坤，或在既济、未济之间来回。</p>}
      <ul className="one-change">
        {lines.map((line, i) => {
          const next = lines.slice() as Line[]
          next[i] = line === 1 ? 0 : 1
          const hex = hexByLines(next)
          return <li key={i}>{YAO_POS[i]}爻 {yaoTitle(i, line)} 变成{line === 1 ? '阴' : '阳'} → {hex.fullName}</li>
        })}
      </ul>
    </div>
  )
}
