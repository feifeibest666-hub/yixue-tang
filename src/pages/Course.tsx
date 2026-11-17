import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LESSONS, UNITS, lessonByDay, type Quiz, type Screen } from '../data/curriculum'
import { SCENE } from '../data/scenes'
import { completeLesson, recordQuiz, scheduleInfo, useStore } from '../lib/store'
import { Rich, Hex } from '../components/Hex'
import { Widget } from '../components/Widgets'
import { HEXAGRAMS } from '../data/bagua'
import { seededShuffle } from '../data/cards'

export function CoursePage() {
  const s = useStore()
  const info = scheduleInfo(s)
  return (
    <div className="page">
      <header className="page-head">
        <div><div className="eyebrow">学程</div><h1>六十一天</h1></div>
        <a className="btn ghost sm" href="#/handout">讲义 / 导出</a>
      </header>
      <p className="muted">第 1–30 天与每日 PDF 讲义同课同序。</p>
      {UNITS.map((u) => {
        const ls = LESSONS.filter((l) => l.unit === u.id)
        const done = ls.filter((l) => s.completed[l.day]).length
        return (
          <section key={u.id} className="unit">
            <div className="unit-banner">
              <img src={SCENE[u.scene]} alt="" loading="lazy" />
              <div className="ub-text">
                <div className="ub-range">{u.range} · {done}/{ls.length}</div>
                <h2>{u.name}</h2>
                <p>{u.desc}</p>
              </div>
            </div>
            <div className="lesson-list">
              {ls.map((l) => {
                const isDone = Boolean(s.completed[l.day])
                const locked = l.day > info.unlockedUpTo
                const status = isDone ? '已学' : locked ? '未解锁' : l.day === info.dayByCalendar ? '今日' : l.day < info.dayByCalendar ? '待补' : '可学'
                return (
                  <a key={l.day} href={locked ? undefined : `#/lesson/${l.day}`} className={`ll ${isDone ? 'done' : ''} ${locked ? 'locked' : ''}`}>
                    <span className="ll-day">{isDone ? '✓' : l.day}</span>
                    <span className="ll-title">{l.title}</span>
                    <span className={`ll-st st-${status}`}>{status}</span>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function LessonPage({ day }: { day: number }) {
  const s = useStore()
  const lesson = lessonByDay(day)
  const info = scheduleInfo(s)
  const [step, setStep] = useState(-1)
  if (!lesson) return <div className="page"><p>没有这一课。</p><a href="#/course">返回学程</a></div>
  if (day > info.unlockedUpTo)
    return (
      <div className="page pad">
        <div className="card center">
          <div className="lock-ico">锁</div>
          <p>第 {day} 天还没解锁。先完成第 {info.next} 天吧。</p>
          <a className="btn primary" href={`#/lesson/${info.next}`}>去第 {info.next} 天</a>
        </div>
      </div>
    )

  if (step === -1) return <LessonCover lesson={lesson} onStart={() => setStep(0)} />

  const total = lesson.screens.length + 1
  const isQuiz = step >= lesson.screens.length
  const sc = lesson.screens[step]
  return (
    <div className="page lesson pad">
      <header className="lesson-head">
        <button onClick={() => setStep(step - 1)} className="back" aria-label="返回">‹</button>
        <div className="lh-mid">
          <div className="lh-day">第 {lesson.day} 天</div>
          <div className="lh-title">{lesson.title}</div>
        </div>
        <a href="#/today" className="back close" aria-label="关闭">×</a>
      </header>
      <div className="dots">
        {Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? 'on' : i < step ? 'past' : ''} />)}
      </div>

      <AnimatePresence mode="wait">
        {!isQuiz ? (
          <motion.div key={step} className="screen" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <ScreenView sc={sc} />
            <div className="nav-btns">
              <button className="btn ghost" onClick={() => setStep(step - 1)}>上一屏</button>
              <button className="btn primary" onClick={() => setStep(step + 1)}>{step === lesson.screens.length - 1 ? '去做练习' : '下一屏'}</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
            <QuizRun day={lesson.day} quiz={lesson.quiz} done={Boolean(s.completed[lesson.day])} onBack={() => setStep(lesson.screens.length - 1)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LessonCover({ lesson, onStart }: { lesson: NonNullable<ReturnType<typeof lessonByDay>>; onStart: () => void }) {
  const unit = UNITS.find((u) => u.id === lesson.unit)
  return (
    <div className="cover">
      <motion.img className="cover-art" src={SCENE[lesson.scene]} alt="" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
      <a href="#/today" className="back close floating" aria-label="关闭">×</a>
      <div className="cover-body">
        <motion.div className="cover-day" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="cd-num">{lesson.day}</span><span>第 {lesson.day} 天 · {unit?.name}</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>{lesson.title}</motion.h1>
        <motion.p className="cover-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{lesson.subtitle}</motion.p>
        <motion.div className="cover-goal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div><span>今日目标</span>{lesson.goal}</div>
          <div><span>用时</span>约 {lesson.minutes} 分钟 · {lesson.screens.length} 屏讲解 · {lesson.quiz.length} 道练习</div>
        </motion.div>
        <motion.button className="btn primary xl" onClick={onStart} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          开始
        </motion.button>
      </div>
    </div>
  )
}

function ScreenView({ sc }: { sc: Screen }) {
  return (
    <>
      <div className="sc-head">
        {sc.t === 'text' && sc.tag && <span className={`tag tag-${sc.tag}`}>{sc.tag}</span>}
        {sc.t === 'widget' && <span className="tag tag-互动">动手</span>}
        <h2>{sc.title}</h2>
      </div>
      {sc.t === 'text' && <Rich text={sc.body} />}
      {sc.t === 'widget' && (<>{sc.body && <Rich text={sc.body} />}<Widget name={sc.w} /></>)}
      {sc.t === 'hex' && <HexReading n={sc.n} />}
    </>
  )
}

function HexReading({ n }: { n: number }) {
  const h = HEXAGRAMS[n - 1]
  return (
    <div className="hex-reading">
      <div className="hr-top">
        <Hex lines={h.lines} size={72} />
        <div>
          <div className="hr-name">{h.name}</div>
          <div className="muted">{h.fullName} · 第 {h.n} 卦</div>
          <div className="hr-gist">{h.gist}</div>
        </div>
      </div>
      <div className="hr-tri">下卦 {h.lower.name}（{h.lower.nature}，{h.lower.trait}）· 上卦 {h.upper.name}（{h.upper.nature}，{h.upper.trait}）</div>
      <p className="classic">{h.guaci}</p>
      <p className="bai">{h.gcBai}</p>
      <details>
        <summary>六爻原文与白话</summary>
        {h.yao.map((y, i) => (
          <div key={i} className="yao-item"><p className="classic">{y}</p><p className="bai">{h.yaoBai[i]}</p></div>
        ))}
      </details>
    </div>
  )
}

function QuizRun({ day, quiz, done, onBack }: { day: number; quiz: Quiz[]; done: boolean; onBack: () => void }) {
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [stamped, setStamped] = useState(false)
  const q = quiz[i]
  const order = useMemo(() => (q ? seededShuffle(q.opts.map((_, k) => k), `${day}-${i}`) : []), [q, day, i])

  if (finished) {
    const finish = () => {
      setStamped(true)
      completeLesson(day)
      setTimeout(() => { window.location.hash = '#/today' }, 1500)
    }
    return (
      <div className="screen center result">
        <div className="result-score"><b>{score}</b><span>/ {quiz.length}</span></div>
        <h2>{score === quiz.length ? '全对。理解到位了。' : score >= quiz.length / 2 ? '不错，错题已收进错题本' : '再看一遍讲解会更清楚，错题已收好'}</h2>
        <div className="stamp-zone">
          <AnimatePresence>
            {(stamped || done) && (
              <motion.div className="big-stamp" initial={{ scale: 2.6, opacity: 0, rotate: -24 }} animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <span>第{day}天</span><b>已学</b>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!done && !stamped && <button className="btn primary block xl" onClick={finish}>盖章打卡</button>}
        {done && <a className="btn primary block" href="#/today">返回今日</a>}
        <button className="btn ghost block" onClick={() => { setI(0); setScore(0); setChosen(null); setFinished(false) }}>再做一遍</button>
      </div>
    )
  }
  const pick = (k: number) => {
    if (chosen !== null) return
    setChosen(k)
    const ok = k === q.a
    if (ok) setScore(score + 1)
    recordQuiz(day, i, ok)
  }
  return (
    <div className="screen">
      <div className="quiz-n">练习 {i + 1} / {quiz.length}</div>
      <h2 className="quiz-q">{q.q}</h2>
      <div className="opts">
        {order.map((k) => (
          <motion.button key={`${i}-${k}`} whileTap={{ scale: 0.98 }}
            animate={chosen !== null && k === chosen && k !== q.a ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            className={`opt ${chosen !== null ? (k === q.a ? 'right' : k === chosen ? 'wrong' : 'dim') : ''}`} onClick={() => pick(k)}>
            {q.opts[k]}
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {chosen !== null && (
          <motion.div className={`explain ${chosen === q.a ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <b>{chosen === q.a ? '对。' : '再想想。'}</b>{q.ex}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="nav-btns">
        <button className="btn ghost" onClick={onBack}>回看讲解</button>
        <button className="btn primary" disabled={chosen === null} onClick={() => { if (i + 1 >= quiz.length) setFinished(true); else { setI(i + 1); setChosen(null) } }}>
          {i + 1 >= quiz.length ? '看结果' : '下一题'}
        </button>
      </div>
    </div>
  )
}
