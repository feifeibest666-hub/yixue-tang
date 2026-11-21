import { useMemo, useState } from 'react'
import { batchCoins, batchYarrow, coinTheory, yarrowEnumeration, yarrowTheory, type YaoNum } from '../../lib/dayan'

const NS = [100, 1000, 10000] as const
const ORDER: YaoNum[] = [6, 7, 8, 9]

export default function ProbStats() {
  const [n, setN] = useState<(typeof NS)[number]>(1000)
  const [tick, setTick] = useState(0)
  const theoryY = useMemo(() => yarrowTheory(), [])
  const theoryC = useMemo(() => coinTheory('back3'), [])
  const proof = useMemo(() => yarrowEnumeration(), [])
  const sim = useMemo(() => ({ yarrow: batchYarrow(n), coin: batchCoins(n, 'back3') }), [n, tick])
  const max = Math.max(theoryY[8], theoryC[7], ...ORDER.map((v) => sim.yarrow[v] / n), ...ORDER.map((v) => sim.coin[v] / n))
  return (
    <div className="adv" data-widget="probStats">
      <div className="seg">
        {NS.map((k) => <button key={k} type="button" className={n === k ? 'on' : ''} onClick={() => setN(k)}>{k} 次</button>)}
      </div>
      <div className="prob" aria-hidden>
        {ORDER.map((v) => (
          <div key={v} className="prob-col">
            <div className="prob-bars">
              <i className="y" style={{ height: `${(sim.yarrow[v] / n / max) * 100}%` }} />
              <i className="yt" style={{ height: `${(theoryY[v] / max) * 100}%` }} />
              <i className="c" style={{ height: `${(sim.coin[v] / n / max) * 100}%` }} />
              <i className="ct" style={{ height: `${(theoryC[v] / max) * 100}%` }} />
            </div>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <div className="prob-key">
        <span><i className="y" />蓍草模拟</span>
        <span><i className="yt" />蓍草理论</span>
        <span><i className="c" />铜钱模拟</span>
        <span><i className="ct" />铜钱理论</span>
      </div>
      <table className="adv-table">
        <thead>
          <tr><th>爻</th><th>蓍草</th><th>理论</th><th>铜钱</th><th>理论</th></tr>
        </thead>
        <tbody>
          {ORDER.map((v) => (
            <tr key={v}>
              <th>{v}</th>
              <td>{pct(sim.yarrow[v] / n)}</td>
              <td>{proof.counts[v]}/64</td>
              <td>{pct(sim.coin[v] / n)}</td>
              <td>{v === 6 || v === 9 ? '1/8' : '3/8'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">蓍草理论把每一变的四种合法余数当成同样可能，64 条路里 6、7、8、9 各有 {proof.counts[6]}、{proof.counts[7]}、{proof.counts[8]}、{proof.counts[9]} 条。铜钱两面公平，八种结果里老阴、少阳、少阴、老阳是 1、3、3、1。背为 3 或字为 3，这四个比例一样。</p>
      <button type="button" className="btn ghost sm" onClick={() => setTick((k) => k + 1)}>再模拟一次</button>
    </div>
  )
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`
