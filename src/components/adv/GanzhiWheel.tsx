import { useState } from 'react'
import { GAN, ZHI, branchRelation, ganZhiOf, stemRelation } from '../../lib/ganzhi'
import { WhyBox } from './bits'

export default function GanzhiWheel() {
  const now = ganZhiOf(new Date())
  const [a, setA] = useState<string | null>(null)
  const [b, setB] = useState<string | null>(null)
  const tap = (name: string) => {
    if (!a || (b && a)) { setA(name); setB(null); return }
    setB(name)
  }
  const isZhi = (s: string) => (ZHI as readonly string[]).includes(s)
  const isGan = (s: string) => (GAN as readonly string[]).includes(s)
  const sameKind = Boolean(a && b && ((isZhi(a) && isZhi(b)) || (isGan(a) && isGan(b))))
  const rel = a && b && sameKind ? (isZhi(a) ? branchRelation(a, b) : stemRelation(a, b)) : null
  return (
    <div className="adv" data-widget="ganzhiWheel">
      <div className="ring-box gz">
        {ZHI.map((zhi, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / 12
          const on = a === zhi || b === zhi
          return (
            <button type="button" key={zhi} className={`gz-zhi ${on ? 'on' : ''}`}
              style={{ left: `${50 + Math.cos(t) * 40}%`, top: `${50 + Math.sin(t) * 40}%` }}
              onClick={() => tap(zhi)}>{zhi}</button>
          )
        })}
        {GAN.map((gan, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / 10
          const on = a === gan || b === gan
          return (
            <button type="button" key={gan} className={`gz-gan ${on ? 'on' : ''}`}
              style={{ left: `${50 + Math.cos(t) * 22}%`, top: `${50 + Math.sin(t) * 22}%` }}
              onClick={() => tap(gan)}>{gan}</button>
          )
        })}
      </div>
      <div className="ly-head today-gz">
        <span>{now.year}年</span><span>{now.month}月</span><span>{now.day}日</span><span>{now.time}时</span>
      </div>
      {a && b && !sameKind && <p className="hint">干和支不放在同一套关系里。请点两个地支，或两个天干。</p>}
      {rel && <WhyBox title={`${a} 与 ${b} · ${rel.title}`} text={rel.why} />}
      {!rel && <p className="hint">外圈十二支，内圈十干。点两支看冲、合、刑、害、三合；点两干看五合。今天的四柱按节气和 23:00 换日。</p>}
    </div>
  )
}
