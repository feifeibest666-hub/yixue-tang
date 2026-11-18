import { useState } from 'react'
import { motion } from 'motion/react'
import { TOTAL_DAYS, UNITS, lessonByDay } from '../data/curriculum'
import { SCENE } from '../data/scenes'
import { addDays, dueCards, isRead, resetAll, scheduleInfo, setStartDate, streak, todayStr, useStore, wrongCards } from '../lib/store'
import { LearningMap } from '../components/LearningMap'
import { Hex } from '../components/Hex'
import { HEXAGRAMS } from '../data/bagua'
import { guaLessonDay } from '../data/curriculum'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

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
  const show = current ?? ahead
  const pct = Math.round((info.doneCount / TOTAL_DAYS) * 100)
  const [showSet, setShowSet] = useState(false)
  const d = new Date()

  return (
    <div className="page today">
      <header className="today-head">
        <div>
          <div className="th-date">{d.getMonth() + 1}月{d.getDate()}日 · 星期{WEEK[d.getDay()]}</div>
          <h1 className="th-title">今日一课</h1>
        </div>
        <div className="th-streak" title="连续打卡天数">
          <b>{st}</b><span>连续</span>
        </div>
      </header>

      {show && (
        <motion.a className={`today-card ${current ? '' : 'is-done'}`} href={`#/lesson/${show.day}`} whileTap={{ scale: 0.985 }}>
          <div className="tc-art"><img src={SCENE[show.scene]} alt="" /></div>
          <div className="tc-body">
            <div className="tc-meta">
              <span className="tc-day">第 {show.day} 天</span>
              <span>{UNITS.find((u) => u.id === show.unit)?.name}</span>
              <span>约 {show.minutes} 分钟</span>
            </div>
            <h2 className="tc-title">{show.title}</h2>
            <p className="tc-sub">{show.subtitle}</p>
            <div className="btn primary block">{current ? '开始今日一课' : `今日已完成 · 提前学第 ${show.day} 天`}</div>
          </div>
          {!current && <div className="tc-stamp">已打卡</div>}
        </motion.a>
      )}
      {!show && <div className="card center"><div className="tc-stamp static">圆满</div><h2>{TOTAL_DAYS} 天主线全部学完</h2></div>}

      <a className="free-entry" href="#/gua">
        <span className="fe-hex"><Hex lines={[1, 1, 1, 1, 1, 1]} size={30} /><Hex lines={[0, 0, 0, 0, 0, 0]} size={30} /></span>
        <span className="fe-t">
          <b>直接学 64 卦</b>
          <span>不按天数，点哪卦学哪卦 · 已读 {HEXAGRAMS.filter((h) => isRead(s, guaLessonDay(h.n))).length}/64</span>
        </span>
        <span className="fe-arrow">›</span>
      </a>

      <div className="stat-row">
        <div><b>{info.doneCount}</b><span>已学</span></div>
        <div><b>{TOTAL_DAYS - info.doneCount}</b><span>待学</span></div>
        <div><b>{pct}%</b><span>进度</span></div>
      </div>

      {info.missed.length > 0 && (
        <section className="card">
          <h3 className="card-title">待补的课 <span className="badge">{info.missed.length}</span></h3>
          {info.missed.slice(0, 4).map((m) => (
            <a key={m} href={`#/lesson/${m}`} className="row-link">
              <span>第 {m} 天 · {lessonByDay(m)?.title}</span><span className="arrow">补学</span>
            </a>
          ))}
        </section>
      )}

      <section className="card">
        <h3 className="card-title">今日功课</h3>
        <ul className="tasks">
          <li className={doneToday ? 'done' : ''}><span className="tick" />学完今日一课并打卡</li>
          <li className={Object.keys(s.cards).length > 0 && due === 0 ? 'done' : ''}>
            <span className="tick" />
            <a href="#/practice/review">{Object.keys(s.cards).length === 0 ? '翻十张八卦卡片' : due > 0 ? `温习到期卡片 ${due} 张` : '今日卡片已温习'}</a>
          </li>
          {wrongN > 0 && <li><span className="tick" /><a href="#/practice/wrong">回看错题 {wrongN} 道</a></li>}
          {Object.keys(s.completed).some((d) => Number(d) >= 114) && <li><span className="tick" /><a href="#/divine">选做：起一卦，写下推断</a></li>}
        </ul>
      </section>

      <section>
        <h2 className="section-title">学习地图</h2>
        <LearningMap completed={s.completed} current={show?.day ?? null} />
      </section>

      <section className="card">
        <h3 className="card-title">打卡</h3>
        <CheckinGrid checkins={s.checkins} />
      </section>

      <div className="settings">
        <button className="link-btn" onClick={() => setShowSet(!showSet)}>设置</button>
        {showSet && (
          <div className="card">
            <label className="row between">开始学习日期
              <input type="date" value={s.startDate} max={today} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
            </label>
            <p className="muted">课程按开始日期每天解锁一课；漏学的课会出现在“待补”。数据只保存在本机浏览器。</p>
            <div className="row">
              <a className="btn ghost sm" href="#/welcome">重看欢迎页</a>
              <button className="btn danger sm" onClick={() => confirm('确定清除所有学习记录吗？') && resetAll()}>清除全部数据</button>
            </div>
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
  const start = addDays(today, -(21 + dow))
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i))
  return (
    <div className="cal">
      {['一', '二', '三', '四', '五', '六', '日'].map((w) => <div key={w} className="cal-h">{w}</div>)}
      {days.map((x) => (
        <div key={x} className={`cal-d ${set.has(x) ? 'on' : ''} ${x === today ? 'today' : ''} ${x > today ? 'future' : ''}`}>
          {set.has(x) ? <span className="cal-seal">学</span> : Number(x.slice(8))}
        </div>
      ))}
    </div>
  )
}
