import { useMemo, useState } from 'react'
import { LESSONS, UNITS, lessonByDay, type Quiz } from '../data/curriculum'
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
        <h1>课程</h1>
        <a className="btn ghost sm" href="#/handout">每日讲义 / 导出</a>
      </header>
      {UNITS.map((u) => (
        <section key={u.id} className="card">
          <h3>{u.name}</h3>
          <div className="muted mb">{u.desc}</div>
          <div className="lesson-list">
            {LESSONS.filter((l) => l.unit === u.id).map((l) => {
              const done = Boolean(s.completed[l.day])
              const locked = l.day > info.unlockedUpTo
              const status = done ? '已学' : locked ? '未解锁' : l.day === info.dayByCalendar ? '今日' : l.day < info.dayByCalendar ? '待补' : '可学'
              return (
                <a key={l.day} href={locked ? undefined : `#/lesson/${l.day}`} className={`ll ${done ? 'done' : ''} ${locked ? 'locked' : ''}`}>
                  <span className="ll-day">{l.day}</span>
                  <span className="ll-title">{l.title}</span>
                  <span className={`ll-st st-${status}`}>{status}</span>
                </a>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function LessonPage({ day }: { day: number }) {
  const s = useStore()
  const lesson = lessonByDay(day)
  const info = scheduleInfo(s)
  const [step, setStep] = useState(0)
  if (!lesson) return <div className="page"><p>没有这一课。</p><a href="#/course">返回课程</a></div>
  if (day > info.unlockedUpTo)
    return (
      <div className="page">
        <div className="card center">
          <div className="big">🔒</div>
          <p>第 {day} 课还没解锁。先完成第 {info.next} 课吧。</p>
          <a className="btn primary" href={`#/lesson/${info.next}`}>去第 {info.next} 课</a>
        </div>
      </div>
    )
  const total = lesson.screens.length + 1
  const isQuiz = step >= lesson.screens.length
  const sc = lesson.screens[step]
  return (
    <div className="page lesson">
      <header className="lesson-head">
        <a href="#/today" className="back">‹</a>
        <div className="lh-mid">
          <div className="lh-day">第 {lesson.day} 课 · 约 {lesson.minutes} 分钟</div>
          <div className="lh-title">{lesson.title}</div>
        </div>
      </header>
      <div className="dots">
        {Array.from({ length: total }, (_, i) => <span key={i} className={i === step ? 'on' : i < step ? 'past' : ''} />)}
      </div>

      {!isQuiz ? (
        <div className="screen" key={step}>
          <h2>{sc.title}</h2>
          {sc.t === 'text' && <Rich text={sc.body} />}
          {sc.t === 'widget' && (<>{sc.body && <Rich text={sc.body} />}<Widget name={sc.w} /></>)}
          {sc.t === 'hex' && <HexReading n={sc.n} />}
          <div className="nav-btns">
            <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>上一屏</button>
            <button className="btn primary" onClick={() => setStep(step + 1)}>{step === lesson.screens.length - 1 ? '去做练习' : '下一屏'}</button>
          </div>
        </div>
      ) : (
        <QuizRun day={lesson.day} quiz={lesson.quiz} done={Boolean(s.completed[lesson.day])} onBack={() => setStep(lesson.screens.length - 1)} />
      )}
    </div>
  )
}

function HexReading({ n }: { n: number }) {
  const h = HEXAGRAMS[n - 1]
  return (
    <div className="hex-reading">
      <div className="hr-top">
        <Hex lines={h.lines} size={70} />
        <div>
          <div className="big">{h.name}</div>
          <div>{h.fullName} · 第 {h.n} 卦</div>
          <div className="muted">{h.gist}</div>
        </div>
      </div>
      <p className="classic">{h.guaci}</p>
      <p className="bai">{h.gcBai}</p>
      <details>
        <summary>六爻爻辞</summary>
        {h.yao.map((y, i) => (
          <div key={i} className="yao-item"><p className="classic">{y}</p><p className="bai">{h.yaoBai[i]}</p></div>
        ))}
      </details>
      <a className="link" href={`#/atlas/${h.n}`}>在图鉴中查看 →</a>
    </div>
  )
}

function QuizRun({ day, quiz, done, onBack }: { day: number; quiz: Quiz[]; done: boolean; onBack: () => void }) {
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const q = quiz[i]
  const order = useMemo(() => (q ? seededShuffle(q.opts.map((_, k) => k), `${day}-${i}`) : []), [q, day, i])

  if (finished) {
    return (
      <div className="screen center">
        <div className="result-ring">{score}/{quiz.length}</div>
        <h2>{score === quiz.length ? '全对，太棒了！' : score >= quiz.length / 2 ? '不错！错题已加入错题本' : '再接再厉，错题已加入错题本'}</h2>
        {!done ? (
          <button className="btn primary block" onClick={() => { completeLesson(day); window.location.hash = '#/today' }}>完成本课 · 打卡</button>
        ) : (
          <a className="btn primary block" href="#/today">返回今日</a>
        )}
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
          <button key={k} className={`opt ${chosen !== null ? (k === q.a ? 'right' : k === chosen ? 'wrong' : 'dim') : ''}`} onClick={() => pick(k)}>{q.opts[k]}</button>
        ))}
      </div>
      {chosen !== null && <div className={`explain ${chosen === q.a ? 'ok' : 'bad'}`}>{chosen === q.a ? '✓ 正确。' : '✗ 不对。'}{q.ex}</div>}
      <div className="nav-btns">
        <button className="btn ghost" onClick={onBack}>回看讲解</button>
        <button className="btn primary" disabled={chosen === null} onClick={() => { if (i + 1 >= quiz.length) setFinished(true); else { setI(i + 1); setChosen(null) } }}>
          {i + 1 >= quiz.length ? '看结果' : '下一题'}
        </button>
      </div>
    </div>
  )
}
