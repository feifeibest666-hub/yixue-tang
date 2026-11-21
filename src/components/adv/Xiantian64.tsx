import { useState } from 'react'
import { Hex } from '../Hex'
import { hexByTrigrams, trigramByName, type Line } from '../../data/bagua'
import { xiantianOrder } from '../../lib/liuyao'

const FANG = ['坤', '艮', '坎', '巽', '震', '离', '兑', '乾']

export default function Xiantian64() {
  const ring = xiantianOrder()
  const [n, setN] = useState(1)
  const sel = ring.find((h) => h.n === n) ?? ring[0]
  return (
    <div className="adv" data-widget="xiantian64">
      <div className="ring-box tian">
        {ring.map((hex, i) => {
          const t = i < 32 ? -(i + 0.5) / 64 * Math.PI * 2 : (i - 32 + 0.5) / 64 * Math.PI * 2
          return (
            <button type="button" key={hex.n} className={`tian-dot ${n === hex.n ? 'on' : ''}`}
              style={{ left: `${50 + Math.sin(t) * 42}%`, top: `${50 - Math.cos(t) * 42}%` }}
              onClick={() => setN(hex.n)} aria-label={hex.name}>
              <Hex lines={hex.lines} size={12} />
            </button>
          )
        })}
        <div className="ring-core">
          <Hex lines={sel.lines} size={48} />
          <b>{sel.fullName}</b>
        </div>
      </div>
      <div className="fang">
        {FANG.map((lo) => FANG.map((up) => {
          const hex = hexByTrigrams(trigramByName(lo), trigramByName(up))
          return (
            <button type="button" key={hex.n} className={n === hex.n ? 'on' : ''} onClick={() => setN(hex.n)} aria-label={hex.name}>
              <Hex lines={hex.lines as Line[]} size={22} />
            </button>
          )
        }))}
      </div>
      <p className="hint">圆图：乾与姤夹着正上方，左半从乾走到复，右半从姤走到坤。方图每一行的下卦、每一列的上卦都按坤艮坎巽震离兑乾；左上是坤，右下是乾。朱熹说方图乾在西北、坤在东南，这里按上南下北、左东右西来放。</p>
    </div>
  )
}
