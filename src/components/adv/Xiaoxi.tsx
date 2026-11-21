import { useState } from 'react'
import { Hex } from '../Hex'
import { HEXAGRAMS } from '../../data/bagua'
import { ganZhiOf } from '../../lib/ganzhi'

const RING = [
  { name: '复', zhi: '子', month: '十一月', msg: '一阳生' },
  { name: '临', zhi: '丑', month: '十二月', msg: '二阳' },
  { name: '泰', zhi: '寅', month: '正月', msg: '三阳' },
  { name: '大壮', zhi: '卯', month: '二月', msg: '四阳' },
  { name: '夬', zhi: '辰', month: '三月', msg: '五阳' },
  { name: '乾', zhi: '巳', month: '四月', msg: '六阳' },
  { name: '姤', zhi: '午', month: '五月', msg: '一阴生' },
  { name: '遯', zhi: '未', month: '六月', msg: '二阴' },
  { name: '否', zhi: '申', month: '七月', msg: '三阴' },
  { name: '观', zhi: '酉', month: '八月', msg: '四阴' },
  { name: '剥', zhi: '戌', month: '九月', msg: '五阴' },
  { name: '坤', zhi: '亥', month: '十月', msg: '六阴' },
]

export default function Xiaoxi() {
  const now = ganZhiOf(new Date()).monthZhi
  const current = Math.max(0, RING.findIndex((item) => item.zhi === now))
  const [sel, setSel] = useState(current)
  const item = RING[sel]
  const hex = HEXAGRAMS.find((h) => h.name === item.name)!
  return (
    <div className="adv" data-widget="xiaoxi">
      <div className="ring-box">
        {RING.map((it, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / 12
          const hexagram = HEXAGRAMS.find((h) => h.name === it.name)!
          return (
            <button type="button" key={it.name} className={`ring-item ${i === sel ? 'on' : ''} ${it.zhi === now ? 'today' : ''}`}
              style={{ left: `${50 + Math.cos(t) * 38}%`, top: `${50 + Math.sin(t) * 38}%` }}
              onClick={() => setSel(i)}>
              <Hex lines={hexagram.lines} size={28} />
              <small>{it.zhi}</small>
            </button>
          )
        })}
        <div className="ring-core"><Hex lines={hex.lines} size={44} /><b>{item.name}</b><span>{item.zhi}月 · {item.msg}</span></div>
      </div>
      <p className="hint">{item.zhi}月（夏历{item.month}）配{item.name}，{item.msg}。汉易用十二消息卦把一年的阴阳消长摊在十二个月上。今天月建{now}，圈上标出来的就是这个月。</p>
    </div>
  )
}
