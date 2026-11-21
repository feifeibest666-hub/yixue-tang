import { useState } from 'react'

const GRID = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
]

type Pick = `r${number}` | `c${number}` | 'd' | 'a' | null

function cells(pick: Pick): [number, number][] {
  if (!pick) return []
  if (pick === 'd') return [[0, 0], [1, 1], [2, 2]]
  if (pick === 'a') return [[0, 2], [1, 1], [2, 0]]
  const i = Number(pick.slice(1))
  if (pick[0] === 'r') return [[i, 0], [i, 1], [i, 2]]
  return [[0, i], [1, i], [2, i]]
}

export default function Luoshu() {
  const [pick, setPick] = useState<Pick>(null)
  const on = new Set(cells(pick).map(([r, c]) => `${r}${c}`))
  const sum = cells(pick).reduce((s, [r, c]) => s + GRID[r][c], 0)
  const choose = (next: Pick) => setPick(pick === next ? null : next)
  return (
    <div className="adv" data-widget="luoshu">
      <div className="ls">
        <span />
        {['左', '中', '右'].map((label, c) => <button type="button" key={`c${c}`} className={pick === `c${c}` ? 'on' : ''} onClick={() => choose(`c${c}`)}>{label}</button>)}
        {GRID.map((row, r) => (
          <div key={r} className="ls-row">
            <button type="button" className={pick === `r${r}` ? 'on' : ''} onClick={() => choose(`r${r}`)}>{['上', '中', '下'][r]}</button>
            {row.map((n, c) => <b key={c} className={on.has(`${r}${c}`) ? 'on' : ''}>{n}</b>)}
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className={`btn ghost sm ${pick === 'd' ? 'on' : ''}`} onClick={() => choose('d')}>主对角线</button>
        <button type="button" className={`btn ghost sm ${pick === 'a' ? 'on' : ''}`} onClick={() => choose('a')}>副对角线</button>
      </div>
      <p className="hint">{pick ? `${pick === 'd' || pick === 'a' ? '这条对角线' : pick[0] === 'r' ? '这一行' : '这一列'}加起来是 ${sum}。` : '点一行、一列或一条对角线。'}洛书是三阶幻方：戴九履一，左三右七，二四为肩，六八为足，五居中央。每行、每列、两条对角线都是 15。</p>
    </div>
  )
}
