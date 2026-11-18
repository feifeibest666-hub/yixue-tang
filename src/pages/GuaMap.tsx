import { motion } from 'motion/react'
import { HEXAGRAMS } from '../data/bagua'
import { guaLessonDay } from '../data/curriculum'
import { isRead, useStore } from '../lib/store'
import { Hex } from '../components/Hex'

const PARTS = [
  { name: '上经', desc: '第 1–30 卦 · 乾到离', from: 1, to: 30 },
  { name: '下经', desc: '第 31–64 卦 · 咸到未济', from: 31, to: 64 },
]

export function GuaMapPage() {
  const s = useStore()
  const readN = HEXAGRAMS.filter((h) => isRead(s, guaLessonDay(h.n))).length
  return (
    <div className="page gua-map">
      <header className="page-head">
        <div><div className="eyebrow">自由学 · 不按天数</div><h1>六十四卦图谱</h1></div>
        <div className="gm-count"><b>{readN}</b><span>/ 64 已读</span></div>
      </header>
      <p className="muted">点任意一卦，直接进入这一卦的完整一课：先拆上下卦推出卦义，再读原文和白话。不用解锁，读完记为“已读”，不影响每日进度和打卡。</p>

      <div className="card gm-start">
        <div>
          <b>零基础也能直接读</b>
          <p>每一课开头都有“看懂这一卦需要的基础”：阴爻阳爻、六爻怎么数、上下卦是什么，都从这一卦的卦画讲起。</p>
        </div>
        <a className="btn primary sm" href="#/gua/1">从乾卦开始</a>
      </div>

      {PARTS.map((p) => (
        <section key={p.name}>
          <h2 className="section-title">{p.name}<small className="gm-part">{p.desc}</small></h2>
          <div className="atlas-grid">
            {HEXAGRAMS.slice(p.from - 1, p.to).map((h, i) => {
              const read = isRead(s, guaLessonDay(h.n))
              return (
                <motion.a key={h.n} href={`#/gua/${h.n}`} className={`atlas-cell ${read ? 'is-read' : ''}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 16) * 0.02 }}>
                  <span className="ac-n">{h.n}</span>
                  {read && <span className="ac-read">读</span>}
                  <Hex lines={h.lines} size={42} />
                  <span className="ac-name">{h.name}</span>
                  <span className="ac-full">{h.fullName}</span>
                </motion.a>
              )
            })}
          </div>
        </section>
      ))}
      <p className="source-note">按每天一课的顺序学：乾到比在第 22–29 天，小畜到未济在第 31–86 天。自由学和每天一课是同一份讲解。</p>
    </div>
  )
}
