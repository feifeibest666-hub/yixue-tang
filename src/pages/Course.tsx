import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ADV_UNITS, ALL_LESSONS, ELECTIVE_UNITS, ELECTIVES, MAIN_DAYS, UNITS, guaOfDay, lessonByDay, lessonLabel, type QA, type Quiz, type Screen, type ToolName, type Unit } from '../data/curriculum'
import { SCENE } from '../data/scenes'
import { completeLesson, isRead, recordQuiz, saveTasks, saveTeach, scheduleInfo, useStore } from '../lib/store'
import { GuaBasics } from '../components/GuaBasics'
import { Rich, Hex } from '../components/Hex'
import { Widget } from '../components/Widgets'
import { HEXAGRAMS } from '../data/bagua'
import { seededShuffle } from '../data/cards'

const KIND_LABEL = { 新: '新课', 练: '练习', 复: '复盘' } as const
const TOOL_HREF: Record<ToolName, string> = {
  liuyao: '#/liuyao', reader: '#/reader', journal: '#/journal',
  meihua: '#/divine', dayan: '#/divine', transform: '#/divine', stats: '#/journal',
}
const TOOL_LABEL: Record<ToolName, string> = {
  liuyao: '打开六爻排盘', reader: '打开原文对照', journal: '打开占筮日记',
  meihua: '去起卦', dayan: '去起卦', transform: '去起卦', stats: '打开占筮日记',
}

export function CoursePage() {
  return (
    <div className="page">
      <header className="page-head">
        <div><div className="eyebrow">学程</div><h1>每天一课</h1></div>
        <a className="btn ghost sm" href="#/handout">讲义 / 导出</a>
      </header>
      <p className="muted">主线 {MAIN_DAYS} 天，与每日 PDF 讲义同课同序：先打基础，第 22 天起每天读一卦，读完六十四卦。每一课都随时可以点开，顺序只是建议。</p>
      {UNITS.map((u) => <UnitBlock key={u.id} u={u} />)}
      <div className="elective-head">
        <h2 className="section-title">选修</h2>
        <p className="muted">想先弄懂“为什么”的，随时可以穿插着学。学完同样盖章打卡，但不计入主线 {MAIN_DAYS} 天的进度。</p>
      </div>
      {ELECTIVE_UNITS.map((u) => <UnitBlock key={u.id} u={u} />)}
      <div className="elective-head">
        <h2 className="section-title">进阶 · 精通之路</h2>
        <p className="muted">主线之后的 17 个阶段，第 {MAIN_DAYS + 1}–730 天。全部随时可学，没有锁。</p>
      </div>
      {ADV_UNITS.map((u) => <UnitBlock key={u.id} u={u} />)}
    </div>
  )
}

const MAIN_AND_ELECTIVE = [...UNITS, ...ELECTIVE_UNITS]

/** 学习地图点开某一阶段：这一阶段的全部课，随时可学 */
export function StagePage({ id }: { id: string }) {
  const group = id.startsWith('a') ? ADV_UNITS : MAIN_AND_ELECTIVE
  const i = group.findIndex((u) => u.id === id)
  const u = group[i]
  if (!u) return <div className="page"><p>没有这一阶段。</p><a href="#/course">返回学程</a></div>
  const prev = group[i - 1], next = group[i + 1]
  const head = u.id.startsWith('a')
    ? `进阶 · 第 ${i + 1} 阶段 · 共 ${ADV_UNITS.length} 阶段`
    : u.id.startsWith('x') ? '选修' : `第 ${i + 1} 阶段 · 共 ${UNITS.length} 阶段`
  const count = (u.id.startsWith('x') ? ELECTIVES : ALL_LESSONS).filter((l) => l.unit === u.id).length
  return (
    <div className="page stage">
      <header className="lesson-head">
        <a href="#/today" className="back" aria-label="返回">‹</a>
        <div className="lh-mid"><div className="lh-day">{head}</div><div className="lh-title">{u.name}</div></div>
      </header>
      <UnitBlock u={u} />
      {count > 0 && <p className="muted center">每一课都可以直接点开，按什么顺序学都行；学完盖章就记为已学。</p>}
      <div className="nav-btns">
        {prev ? <a className="btn ghost" href={`#/stage/${prev.id}`}>‹ {prev.name}</a> : <span />}
        {next ? <a className="btn ghost" href={`#/stage/${next.id}`}>{next.name} ›</a> : <a className="btn ghost" href="#/course">全部课程</a>}
      </div>
    </div>
  )
}

function UnitBlock({ u }: { u: Unit }) {
  const s = useStore()
  const info = scheduleInfo(s)
  const pool = u.id.startsWith('x') ? ELECTIVES : ALL_LESSONS
  const ls = pool.filter((l) => l.unit === u.id)
  const done = ls.filter((l) => s.completed[l.day]).length
  const banner = (
    <div className="unit-banner">
      <img src={SCENE[u.scene]} alt="" loading="lazy" />
      <div className="ub-text">
        <div className="ub-range">{u.range} · {done}/{ls.length}</div>
        <h2>{u.name}</h2>
        <p>{u.desc}</p>
      </div>
    </div>
  )
  return (
    <section className={`unit ${u.id.startsWith('x') ? 'is-elective' : ''} ${u.id.startsWith('a') ? 'is-adv' : ''}`}>
      {u.id.startsWith('a') ? <a className="unit-open" href={`#/stage/${u.id}`}>{banner}</a> : banner}
      {ls.length === 0 ? <p className="empty-stage">课程制作中</p> : (
      <div className="lesson-list">
        {ls.map((l) => {
          const isDone = Boolean(s.completed[l.day])
          const status = isDone ? '已学' : l.elective ? '可学' : l.day === info.dayByCalendar ? '今日' : l.day < info.dayByCalendar ? '待补' : '可学'
          return (
            <a key={l.day} href={`#/lesson/${l.day}`} className={`ll ${isDone ? 'done' : ''}`}>
              <span className="ll-day">{isDone ? '✓' : l.elective ? l.elective.split(' ')[1] : l.day}</span>
              <span className="ll-title">{l.title}</span>
              {l.kind && <span className={`kind kind-${l.kind}`}>{KIND_LABEL[l.kind]}</span>}
              <span className={`ll-st st-${status}`}>{status}</span>
            </a>
          )
        })}
      </div>
      )}
    </section>
  )
}

/** free：从六十四卦图谱进入，基础回顾默认展开，学完回到图谱 */
export function LessonPage({ day, free = false }: { day: number; free?: boolean }) {
  const s = useStore()
  const lesson = lessonByDay(day)
  const [step, setStep] = useState(-1)
  const gua = guaOfDay(day)
  const exit = free ? '#/gua' : '#/today'
  if (!lesson || (free && !gua)) return <div className="page"><p>没有这一课。</p><a href="#/course">返回学程</a></div>
  if (step === -1) return <LessonCover lesson={lesson} free={free} gua={gua} exit={exit} onStart={() => setStep(0)} />

  const total = lesson.screens.length + 1
  const isQuiz = step >= lesson.screens.length
  const sc = lesson.screens[step]
  return (
    <div className="page lesson pad">
      <header className="lesson-head">
        <button onClick={() => setStep(step - 1)} className="back" aria-label="返回">‹</button>
        <div className="lh-mid">
          <div className="lh-day">{free ? (gua ? `自由学 · 第 ${gua} 卦` : `自由学 · ${lessonLabel(lesson)}`) : lessonLabel(lesson)}</div>
          <div className="lh-title">{lesson.title}</div>
        </div>
        <a href={exit} className="back close" aria-label="关闭">×</a>
      </header>
      <div className="dots">
        {Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? 'on' : i < step ? 'past' : ''} />)}
      </div>

      <AnimatePresence mode="wait">
        {!isQuiz ? (
          <motion.div key={step} className="screen" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            {step === 0 && gua && <GuaBasics n={gua} open={free} />}
            <ScreenView sc={sc} day={lesson.day} />
            <div className="nav-btns">
              <button className="btn ghost" onClick={() => setStep(step - 1)}>上一屏</button>
              <button className="btn primary" onClick={() => setStep(step + 1)}>{step === lesson.screens.length - 1 ? '去做练习' : '下一屏'}</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
            <QuizRun day={lesson.day} label={lesson.elective ?? `第${lesson.day}天`} quiz={lesson.quiz} qa={lesson.qa} done={isRead(s, lesson.day)}
              back={free ? '#/gua' : lesson.elective ? '#/course' : '#/today'}
              backLabel={free ? '回到六十四卦图谱' : lesson.elective ? '返回学程' : '返回今日'}
              onBack={() => setStep(lesson.screens.length - 1)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LessonCover({ lesson, free, gua, exit, onStart }: { lesson: NonNullable<ReturnType<typeof lessonByDay>>; free: boolean; gua: number | null; exit: string; onStart: () => void }) {
  const unit = [...UNITS, ...ELECTIVE_UNITS, ...ADV_UNITS].find((u) => u.id === lesson.unit)
  return (
    <div className="cover">
      <motion.img className="cover-art" src={SCENE[lesson.scene]} alt="" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
      <a href={exit} className="back close floating" aria-label="关闭">×</a>
      <div className="cover-body">
        <motion.div className="cover-day" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {free
            ? <><span className="cd-num">{gua ?? lesson.day}</span><span>自由学 · {gua ? `第 ${gua} 卦 · 不按天数` : `${lessonLabel(lesson)}的内容`}</span></>
            : <><span className="cd-num">{lesson.elective ? lesson.elective.split(' ')[1] : lesson.day}</span><span>{lessonLabel(lesson)} · {unit?.name}</span></>}
          {lesson.kind && <span className={`kind kind-${lesson.kind}`}>{KIND_LABEL[lesson.kind]}</span>}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>{lesson.title}</motion.h1>
        <motion.p className="cover-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{lesson.subtitle}</motion.p>
        <motion.div className="cover-goal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div><span>{free ? '本课目标' : '今日目标'}</span>{lesson.goal}</div>
          <div><span>用时</span>约 {lesson.minutes} 分钟 · {lesson.screens.length} 屏讲解 · {lesson.quiz.length} 道练习</div>
        </motion.div>
        <motion.button className="btn primary xl" onClick={onStart} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          开始
        </motion.button>
      </div>
    </div>
  )
}

function ScreenView({ sc, day }: { sc: Screen; day: number }) {
  const tag = sc.t === 'text' ? sc.tag
    : sc.t === 'widget' ? null
    : sc.t === 'quote' ? '原文'
    : sc.t === 'compare' ? '对照'
    : sc.t === 'teach' ? '讲解'
    : sc.t === 'task' ? '练习'
    : sc.t === 'chain' ? '推导'
    : null
  const tagClass = sc.t === 'text' && sc.tag ? `tag-${sc.tag}`
    : sc.t === 'widget' ? 'tag-互动'
    : sc.t === 'quote' ? 'tag-原文'
    : sc.t === 'compare' ? 'tag-传统'
    : sc.t === 'teach' ? 'tag-小结'
    : sc.t === 'task' ? 'tag-互动'
    : sc.t === 'chain' ? 'tag-推导'
    : ''
  return (
    <>
      <div className="sc-head">
        {sc.t === 'widget' && <span className="tag tag-互动">动手</span>}
        {tag && sc.t !== 'widget' && <span className={`tag ${tagClass}`}>{tag}</span>}
        <h2>{sc.title}</h2>
      </div>
      {sc.t === 'text' && <Rich text={sc.body} />}
      {sc.t === 'widget' && (<>{sc.body && <Rich text={sc.body} />}<Widget name={sc.w} /></>)}
      {sc.t === 'hex' && <HexReading n={sc.n} />}
      {sc.t === 'quote' && (
        <div className="quote-card">
          <div className="quote-src">{sc.src}</div>
          <p className="quote-text">{sc.text}</p>
          {sc.note && <p className="quote-note">{sc.note}</p>}
        </div>
      )}
      {sc.t === 'compare' && (
        <div className="cmp">
          <p className="cmp-focus">{sc.focus}</p>
          {sc.items.map((it, i) => (
            <div className="cmp-row" key={i}><b>{it.who}</b><span>{it.view}</span></div>
          ))}
          <div className="cmp-diff">{sc.diff}</div>
        </div>
      )}
      {sc.t === 'teach' && <TeachCard day={day} prompt={sc.prompt} points={sc.points} />}
      {sc.t === 'task' && <TaskCard day={day} items={sc.items} tool={sc.tool} />}
      {sc.t === 'chain' && <ChainCard steps={sc.steps} seed={`${day}:${sc.title}`} />}
    </>
  )
}

function TeachCard({ day, prompt, points }: { day: number; prompt: string; points: string[] }) {
  const s = useStore()
  const saved = s.teach[day] ?? { text: '', ticks: [] as number[] }
  const toggle = (i: number) => {
    const ticks = saved.ticks.includes(i) ? saved.ticks.filter((n) => n !== i) : [...saved.ticks, i]
    saveTeach(day, saved.text, ticks)
  }
  return (
    <div className="teach-card">
      <p className="teach-prompt">{prompt}</p>
      <textarea rows={6} value={saved.text} placeholder="用自己的话讲一遍，写在这里" onChange={(e) => saveTeach(day, e.target.value, saved.ticks)} />
      <ul className="check-list">
        {points.map((p, i) => (
          <li key={i}>
            <button type="button" className={saved.ticks.includes(i) ? 'on' : ''} onClick={() => toggle(i)}>
              <span className="tick" />{p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TaskCard({ day, items, tool }: { day: number; items: string[]; tool?: ToolName }) {
  const s = useStore()
  const ticks = s.tasks[day] ?? []
  const toggle = (i: number) => {
    const next = ticks.includes(i) ? ticks.filter((n) => n !== i) : [...ticks, i]
    saveTasks(day, next)
  }
  return (
    <div className="task-card">
      <ul className="check-list">
        {items.map((p, i) => (
          <li key={i}>
            <button type="button" className={ticks.includes(i) ? 'on' : ''} onClick={() => toggle(i)}>
              <span className="tick" />{p}
            </button>
          </li>
        ))}
      </ul>
      {tool && <a className="btn ghost block task-go" href={TOOL_HREF[tool]}>{TOOL_LABEL[tool]}</a>}
    </div>
  )
}

function ChainCard({ steps, seed }: { steps: string[]; seed: string }) {
  const order = useMemo(() => {
    const idx = seededShuffle(steps.map((_, i) => i), seed)
    if (idx.length > 1 && idx.every((v, i) => v === i)) [idx[0], idx[1]] = [idx[1], idx[0]]
    return idx
  }, [steps, seed])
  const [picked, setPicked] = useState<number[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const toggle = (orig: number) => {
    setResult(null)
    setPicked((p) => p.includes(orig) ? p.filter((n) => n !== orig) : [...p, orig])
  }
  const check = () => setResult(picked.length === steps.length && picked.every((v, i) => v === i))
  return (
    <div className="chain-card">
      <p className="muted">点按打乱的步骤，按你认为的先后排好，再核对。</p>
      <div className="chain-pool">
        {order.map((orig) => {
          const at = picked.indexOf(orig)
          return (
            <button type="button" key={orig} className={`chain-step ${at >= 0 ? 'on' : ''}`} onClick={() => toggle(orig)}>
              <span className="chain-n">{at >= 0 ? at + 1 : ''}</span>
              <span>{steps[orig]}</span>
            </button>
          )
        })}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn ghost sm" onClick={() => { setPicked([]); setResult(null) }}>重来</button>
        <button type="button" className="btn primary sm" disabled={picked.length !== steps.length} onClick={check}>核对顺序</button>
      </div>
      {result === true && <p className="chain-result ok">顺序正确。</p>}
      {result === false && (
        <div className="chain-result bad">
          <p>顺序不正确。</p>
          <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}
    </div>
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

function QuizRun({ day, label, quiz, qa, done, back, backLabel, onBack }: { day: number; label: string; quiz: Quiz[]; qa?: QA[]; done: boolean; back: string; backLabel: string; onBack: () => void }) {
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
      setTimeout(() => { window.location.hash = back }, 1500)
    }
    return (
      <div className="screen center result">
        <div className="result-score"><b>{score}</b><span>/ {quiz.length}</span></div>
        <h2>{score === quiz.length ? '全对。理解到位了。' : score >= quiz.length / 2 ? '不错，错题已收进错题本' : '再看一遍讲解会更清楚，错题已收好'}</h2>
        {qa && qa.length > 0 && (
          <details className="qa-fold">
            <summary>问答</summary>
            {qa.map((item, i) => (
              <div className="qa-item" key={i}><b>{item.q}</b><p>{item.a}</p></div>
            ))}
          </details>
        )}
        <div className="stamp-zone">
          <AnimatePresence>
            {(stamped || done) && (
              <motion.div className="big-stamp" initial={{ scale: 2.6, opacity: 0, rotate: -24 }} animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <span>{label}</span><b>已学</b>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!done && !stamped && <button className="btn primary block xl" onClick={finish}>盖章打卡</button>}
        {done && <a className="btn primary block" href={back}>{backLabel}</a>}
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
