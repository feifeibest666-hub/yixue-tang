import { LESSONS, TOTAL_DAYS, UNITS, lessonByDay } from '../data/curriculum'
import { addDays, dueCards, resetAll, scheduleInfo, setStartDate, streak, todayStr, useStore, wrongCards } from '../lib/store'
import { useState } from 'react'

export function TodayPage() {
  const s = useStore()
  const info = scheduleInfo(s)
  const today = todayStr()
  const due = dueCards(s).length
  const wrongN = wrongCards(s).length + Object.keys(s.wrong).length
  const st = streak(s)
  const doneToday = s.checkins.includes(today)
  const current = info.todayLesson ? lessonByDay(info.todayLesson)! : null
  const ahead = !current && info.next ? lessonByDay(info.next)! : null
  const pct = Math.round((info.doneCount / TOTAL_DAYS) * 100)
  const [showSet, setShowSet] = useState(false)

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-sub">{today.replace(/-/g, '.')} · 学习第 {info.dayByCalendar} 天</div>
            <h1>今日一课</h1>
          </div>
          <div className="streak"><b>{st}</b><span>连续打卡</span></div>
        </div>
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="hero-meta">已学 {info.doneCount} / {TOTAL_DAYS} 课 · {pct}%</div>
      </header>

      {current ? (
        <a className="lesson-card main-card" href={`#/lesson/${current.day}`}>
          <div className="lc-day">第 {current.day} 课</div>
          <div className="lc-title">{current.title}</div>
          <div className="lc-goal">🎯 {current.goal}</div>
          <div className="lc-meta">{UNITS.find((u) => u.id === current.unit)?.name} · 约 {current.minutes} 分钟 · {current.quiz.length} 道练习</div>
          <div className="btn primary block">开始学习</div>
        </a>
      ) : (
        <div className="lesson-card done-card">
          <div className="done-seal">已打卡</div>
          <div className="lc-title">{info.doneCount >= TOTAL_DAYS ? '全部课程已完成！' : '今天的课已经学完啦'}</div>
          {ahead && <a className="btn ghost block" href={`#/lesson/${ahead.day}`}>精力充沛？提前学第 {ahead.day} 课：{ahead.title}</a>}
        </div>
      )}

      {info.missed.length > 0 && (
        <section className="card">
          <h3>待补的课 <span className="badge">{info.missed.length}</span></h3>
          <div className="missed">
            {info.missed.slice(0, 5).map((d) => (
              <a key={d} href={`#/lesson/${d}`} className="missed-item">第 {d} 课 · {lessonByDay(d)?.title}<span>补学 →</span></a>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3>今日任务</h3>
        <ul className="tasks">
          <li className={doneToday ? 'done' : ''}><span className="tick" />完成今日一课并打卡</li>
          <li className={s.cards && Object.keys(s.cards).length > 0 && due === 0 ? 'done' : ''}>
            <span className="tick" />
            <a href="#/practice/review">{Object.keys(s.cards).length === 0 ? '开始记忆卡片（八卦）' : due > 0 ? `复习到期卡片 ${due} 张` : '今天的卡片都复习完了'}</a>
          </li>
          {wrongN > 0 && <li><span className="tick" /><a href="#/practice/wrong">复习错题 {wrongN} 道</a></li>}
          {info.dayByCalendar >= 40 && <li><span className="tick" /><a href="#/divine">选做：起一卦，写下推断</a></li>}
        </ul>
      </section>

      <section className="card">
        <h3>打卡日历（近 5 周）</h3>
        <CheckinGrid checkins={s.checkins} />
      </section>

      <section className="card">
        <h3>学习路线</h3>
        {UNITS.map((u) => {
          const ls = LESSONS.filter((l) => l.unit === u.id)
          const d = ls.filter((l) => s.completed[l.day]).length
          return (
            <a key={u.id} className="unit-row" href={`#/course`}>
              <div><b>{u.name}</b><div className="muted">第 {ls[0].day}～{ls[ls.length - 1].day} 天 · {u.desc}</div></div>
              <div className="unit-pct">{d}/{ls.length}</div>
            </a>
          )
        })}
      </section>

      <div className="settings">
        <button className="link-btn" onClick={() => setShowSet(!showSet)}>设置</button>
        {showSet && (
          <div className="card">
            <label className="row">开始学习日期
              <input type="date" value={s.startDate} max={today} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
            </label>
            <p className="muted">课程按开始日期每天解锁一课。漏学的课会出现在“待补”里。数据只保存在本机浏览器中。</p>
            <button className="btn danger" onClick={() => confirm('确定清除所有学习记录吗？') && resetAll()}>清除全部数据</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckinGrid({ checkins }: { checkins: string[] }) {
  const set = new Set(checkins)
  const today = todayStr()
  const dow = (new Date().getDay() + 6) % 7
  const start = addDays(today, -(28 + dow))
  const days = Array.from({ length: 35 }, (_, i) => addDays(start, i))
  return (
    <div className="cal">
      {['一', '二', '三', '四', '五', '六', '日'].map((w) => <div key={w} className="cal-h">{w}</div>)}
      {days.map((d) => (
        <div key={d} className={`cal-d ${set.has(d) ? 'on' : ''} ${d === today ? 'today' : ''} ${d > today ? 'future' : ''}`} title={d}>
          {Number(d.slice(8))}
        </div>
      ))}
    </div>
  )
}
