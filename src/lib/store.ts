import { useSyncExternalStore } from 'react'
import { ELECTIVES, TOTAL_DAYS } from '../data/curriculum'

export interface Card { box: number; due: string; lapses: number; seen: number }
export interface WrongQ { day: number; idx: number; count: number; last: string }
export interface SavedCase {
  id: string
  createdAt: string
  question: string
  method: 'time' | 'number'
  inputLabel: string
  params: { a?: number; b?: number; addHour?: boolean; time?: string; lateZi?: boolean }
  benN: number; huN: number; bianN: number; moving: number
  ti: string; yong: string; relation: string
  myJudgement: string
  outcome: string
  review: string
}

export interface State {
  startDate: string
  completed: Record<number, string> // day -> 完成日期
  checkins: string[]
  cards: Record<string, Card>
  wrong: Record<string, WrongQ>
  cases: SavedCase[]
  onboarded?: boolean
}

const KEY = 'zhouyi-xuexi-v1'
export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const addDays = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number)
  return todayStr(new Date(y, m - 1, d + n))
}
export const daysBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { completed: {}, checkins: [], cards: {}, wrong: {}, cases: [], ...JSON.parse(raw) }
  } catch { /* 数据损坏时重新开始 */ }
  return { startDate: todayStr(), completed: {}, checkins: [], cards: {}, wrong: {}, cases: [] }
}

let state: State = load()
const listeners = new Set<() => void>()
const persist = () => localStorage.setItem(KEY, JSON.stringify(state))
persist()

export function update(fn: (s: State) => State | void) {
  const draft = structuredClone(state)
  const r = fn(draft)
  state = r ?? draft
  persist()
  listeners.forEach((l) => l())
}
export const useStore = () =>
  useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
export const getState = () => state

// ── 每日课程进度 ──
export function scheduleInfo(s: State, today = todayStr()) {
  const dayByCalendar = Math.min(TOTAL_DAYS, daysBetween(s.startDate, today) + 1)
  const done = (d: number) => Boolean(s.completed[d])
  const missed: number[] = []
  for (let d = 1; d < dayByCalendar; d++) if (!done(d)) missed.push(d)
  const todayLesson = done(dayByCalendar) ? null : dayByCalendar
  let next = 1
  while (next <= TOTAL_DAYS && done(next)) next++
  const unlockedUpTo = Math.max(dayByCalendar, next)
  return { dayByCalendar, missed, todayLesson, next: next > TOTAL_DAYS ? null : next, unlockedUpTo, doneCount: Object.keys(s.completed).filter((d) => Number(d) <= TOTAL_DAYS).length }
}

/** 选修：学完第 30 天后开放原理；原理全部学完后开放梅花；各模块内按顺序 */
export function isUnlocked(s: State, day: number) {
  if (day <= TOTAL_DAYS) return day <= scheduleInfo(s).unlockedUpTo
  const l = ELECTIVES.find((x) => x.day === day)
  if (!l || !s.completed[30]) return false
  const mod = ELECTIVES.filter((x) => x.unit === l.unit)
  const prereq = l.unit === 'x2' ? ELECTIVES.filter((x) => x.unit === 'x1') : []
  return [...prereq, ...mod.filter((x) => x.day < day)].every((x) => s.completed[x.day])
}

export function completeLesson(day: number) {
  update((s) => {
    const t = todayStr()
    if (!s.completed[day]) s.completed[day] = t
    if (!s.checkins.includes(t)) s.checkins.push(t)
  })
}

export function streak(s: State, today = todayStr()) {
  const set = new Set(s.checkins)
  let d = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(d)) { n++; d = addDays(d, -1) }
  return n
}

export function recordQuiz(day: number, idx: number, correct: boolean) {
  update((s) => {
    const k = `${day}-${idx}`
    if (!correct) {
      const w = s.wrong[k] ?? { day, idx, count: 0, last: '' }
      w.count++; w.last = todayStr()
      s.wrong[k] = w
    }
  })
}
export const clearWrong = (k: string) => update((s) => { delete s.wrong[k] })

// ── 间隔重复（Leitner 盒子） ──
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30]
export function reviewCard(id: string, correct: boolean) {
  update((s) => {
    const c = s.cards[id] ?? { box: 0, due: todayStr(), lapses: 0, seen: 0 }
    c.seen++
    if (correct) {
      c.box = Math.min(c.box + 1, INTERVALS.length - 1)
      c.due = addDays(todayStr(), INTERVALS[c.box])
    } else {
      c.box = 0; c.lapses++; c.due = todayStr()
    }
    s.cards[id] = c
  })
}
export const dueCards = (s: State, today = todayStr()) =>
  Object.entries(s.cards).filter(([, c]) => c.due <= today).map(([id]) => id)
export const wrongCards = (s: State) =>
  Object.entries(s.cards).filter(([, c]) => c.lapses > 0 && c.box < 3).map(([id]) => id)

export const resetAll = () => {
  localStorage.removeItem(KEY)
  state = load(); persist(); listeners.forEach((l) => l())
}
export const finishOnboarding = () => update((s) => {
  if (!Object.keys(s.completed).length) s.startDate = todayStr()
  s.onboarded = true
})
export const isOnboarded = (s: State) => Boolean(s.onboarded || Object.keys(s.completed).length)
export const setStartDate = (d: string) => update((s) => { s.startDate = d })
