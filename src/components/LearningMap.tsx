import { motion } from 'motion/react'
import { ADV_UNITS, ELECTIVES, ELECTIVE_UNITS, LESSONS, UNITS, unitDayRange } from '../data/curriculum'
import { SCENE } from '../data/scenes'

export function LearningMap({ completed, current }: { completed: Record<number, string>; current: number | null }) {
  const curLesson = current ? LESSONS.find((l) => l.day === current) : undefined
  const curUnit = curLesson?.unit ?? (current ? [...UNITS, ...ADV_UNITS].find((u) => {
    const r = unitDayRange(u)
    return Boolean(r && current >= r[0] && current <= r[1])
  })?.id : undefined)
  return (
    <>
    <ol className="lmap">
      {UNITS.map((u, i) => {
        const ls = LESSONS.filter((l) => l.unit === u.id)
        const done = ls.filter((l) => completed[l.day]).length
        const here = u.id === curUnit
        const finished = done === ls.length
        return (
          <motion.li key={u.id} className={`lm-stage ${here ? 'here' : ''} ${finished ? 'finished' : ''}`}
            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <div className="lm-node"><span>{finished ? '✓' : i + 1}</span></div>
            <a className="lm-card" href={`#/stage/${u.id}`}>
              <img src={SCENE[u.scene]} alt="" loading="lazy" />
              <div className="lm-text">
                <div className="lm-range">{u.range} · {ls.length} 课</div>
                <div className="lm-name">{u.name}</div>
                <div className="lm-desc">{u.desc}</div>
                {(done > 0 || here) && (
                  <div className="lm-bar"><i style={{ width: `${(done / ls.length) * 100}%` }} /></div>
                )}
              </div>
              {here && <div className="lm-here">你在这里 · 第 {current} 天</div>}
              <span className="lm-go" aria-hidden>›</span>
            </a>
          </motion.li>
        )
      })}
    </ol>
    <div className="lm-side">
      <div className="lm-side-h">选修 · 随时可学</div>
      <div className="lm-side-row">
        {ELECTIVE_UNITS.map((u) => {
          const ls = ELECTIVES.filter((l) => l.unit === u.id)
          const done = ls.filter((l) => completed[l.day]).length
          return (
            <a key={u.id} className="lm-side-card" href={`#/stage/${u.id}`}>
              <img src={SCENE[u.scene]} alt="" loading="lazy" />
              <b>{u.name.replace('选修 · ', '')}</b>
              <span>{done}/{ls.length} 课 · 点开看课表</span>
            </a>
          )
        })}
      </div>
    </div>
    <div className="lm-adv">
      <div className="lm-side-h">进阶 · 精通之路</div>
      {ADV_UNITS.map((u) => {
        const ls = LESSONS.filter((l) => l.unit === u.id)
        const done = ls.filter((l) => completed[l.day]).length
        const here = u.id === curUnit
        return (
          <a key={u.id} className={`lm-adv-row ${here ? 'here' : ''}`} href={`#/stage/${u.id}`}>
            <span className="lm-adv-n">{u.id.slice(1)}</span>
            <span className="lm-adv-name">{u.name}</span>
            <span className="lm-adv-meta">{ls.length ? `${done}/${ls.length}` : '制作中'}</span>
            {here && <span className="lm-adv-here">你在这里 · 第 {current} 天</span>}
            <span className="lm-go" aria-hidden>›</span>
          </a>
        )
      })}
    </div>
    </>
  )
}
