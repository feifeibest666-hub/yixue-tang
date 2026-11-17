import { motion } from 'motion/react'
import { LESSONS, UNITS } from '../data/curriculum'
import { SCENE } from '../data/scenes'

export function LearningMap({ completed, current }: { completed: Record<number, string>; current: number | null }) {
  const curUnit = current ? LESSONS.find((l) => l.day === current)?.unit : undefined
  return (
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
  )
}
