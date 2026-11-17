import { motion } from 'motion/react'
import { ELECTIVES, ELECTIVE_UNITS, LESSONS, UNITS } from '../data/curriculum'
import { SCENE } from '../data/scenes'

export function LearningMap({ completed, current }: { completed: Record<number, string>; current: number | null }) {
  const curUnit = current ? LESSONS.find((l) => l.day === current)?.unit : undefined
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
            <a className="lm-card" href={here && current ? `#/lesson/${current}` : '#/course'}>
              <img src={SCENE[u.scene]} alt="" loading="lazy" />
              <div className="lm-text">
                <div className="lm-range">{u.range}</div>
                <div className="lm-name">{u.name}</div>
                <div className="lm-desc">{u.desc}</div>
                {(done > 0 || here) && (
                  <div className="lm-bar"><i style={{ width: `${(done / ls.length) * 100}%` }} /></div>
                )}
              </div>
              {here && <div className="lm-here">你在这里 · 第 {current} 天</div>}
            </a>
          </motion.li>
        )
      })}
    </ol>
    <div className="lm-side">
      <div className="lm-side-h">选修 · 随时穿插</div>
      <div className="lm-side-row">
        {ELECTIVE_UNITS.map((u) => {
          const ls = ELECTIVES.filter((l) => l.unit === u.id)
          const done = ls.filter((l) => completed[l.day]).length
          const open = u.id === 'x1' ? Boolean(completed[30]) : ELECTIVES.filter((l) => l.unit === 'x1').every((l) => completed[l.day])
          return (
            <a key={u.id} className={`lm-side-card ${open ? '' : 'locked'}`} href="#/course">
              <img src={SCENE[u.scene]} alt="" loading="lazy" />
              <b>{u.name.replace('选修 · ', '')}</b>
              <span>{open ? `${done}/${ls.length} 课` : u.id === 'x1' ? '第 30 天后开放' : '原理学完后开放'}</span>
            </a>
          )
        })}
      </div>
    </div>
    </>
  )
}
