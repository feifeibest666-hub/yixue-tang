import { motion } from 'motion/react'
import { SCENE } from '../data/scenes'
import { finishOnboarding } from '../lib/store'
import { LearningMap } from '../components/LearningMap'
import { Hex } from '../components/Hex'

const PROMISES = [
  { k: '一', t: '每天一课，十分钟', d: '有建议顺序，但每一课都随时能点开' },
  { k: '二', t: '先懂为什么，再记结论', d: '每个规则都讲来历，约定俗成的会明说' },
  { k: '三', t: '从一条线读完六十四卦', d: '阴阳 → 八卦 → 每天一卦；原理与梅花易数在选修里' },
]

export function WelcomePage() {
  const start = () => { finishOnboarding(); window.location.hash = '#/lesson/1' }
  const skip = () => { finishOnboarding(); window.location.hash = '#/today' }
  const free = () => { finishOnboarding(); window.location.hash = '#/gua' }
  return (
    <div className="welcome">
      <section className="wl-hero">
        <motion.img src={SCENE.welcome} alt="" initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
        <div className="wl-title">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>易学堂</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>零基础，读懂《周易》与梅花易数</motion.p>
          <motion.div className="wl-seal" initial={{ scale: 1.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: -6 }} transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 16 }}>易</motion.div>
        </div>
      </section>

      <section className="wl-body">
        <motion.button className="btn primary xl" onClick={start} whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          从这里开始 · 第 1 课
        </motion.button>
        <p className="wl-sub">第 1 课：《周易》是一本什么书？约 10 分钟</p>
        <motion.button className="wl-free" onClick={free} whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <span className="wl-free-hex"><Hex lines={[1, 1, 1, 1, 1, 1]} size={26} /><Hex lines={[0, 0, 0, 0, 0, 0]} size={26} /></span>
          <span className="wl-free-t"><b>直接学 64 卦</b><span>不按天数，点哪卦学哪卦；每卦开头补上需要的基础</span></span>
          <span className="wl-free-arrow">›</span>
        </motion.button>

        <ul className="wl-promises">
          {PROMISES.map((p, i) => (
            <motion.li key={p.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.12 }}>
              <span className="wl-k">{p.k}</span>
              <div><b>{p.t}</b><span>{p.d}</span></div>
            </motion.li>
          ))}
        </ul>

        <h2 className="section-title">学习地图</h2>
        <p className="muted center">主线六个阶段、八十六天，读完六十四卦；原理与梅花易数是两门选修。你会从第一站出发。</p>
        <LearningMap completed={{}} current={1} />

        <button className="link-btn center-block" onClick={skip}>我已经学过一些，直接进入</button>
      </section>
    </div>
  )
}
