import { useSyncExternalStore } from 'react'
import { LESSONS, TOTAL_DAYS } from '../data/curriculum'

export interface Card { box: number; due: string; lapses: number; seen: number }
export interface WrongQ { day: number; idx: number; count: number; last: string }
export interface SavedCase {
  id: string
  createdAt: string
  question: string
  method: 'time' | 'number' | 'liuyao' | 'dayan'
  inputLabel: string
  params: { a?: number; b?: number; addHour?: boolean; time?: string; lateZi?: boolean }
  benN: number; huN: number; bianN: number; moving: number
  ti: string; yong: string; relation: string
  myJudgement: string
  outcome: string
  review: string
  /** 事先写下、事后可以对照的预测 */
  prediction?: string
  /** 0–100 */
  confidence?: number
  deadline?: string
  hit?: 'hit' | 'miss' | 'unclear'
  /** 六爻自下而上，每爻 6 / 7 / 8 / 9 */
  raw?: number[]
}

export interface State {
  startDate: string
  completed: Record<number, string> // day -> 完成日期
  checkins: string[]
  cards: Record<string, Card>
  wrong: Record<string, WrongQ>
  cases: SavedCase[]
  onboarded?: boolean
  /** 旧版自由学记下的“已读”（课号 -> 日期）；现在学完一律记入 completed，这里只读不写 */
  freeRead?: Record<number, string>
  /** 讲给我听：每天一份讲解和已勾的要点序号 */
  teach: Record<number, { text: string; ticks: number[] }>
  /** 练习清单：每天已勾的条目序号 */
  tasks: Record<number, number[]>
  /** 存档版本。缺省或 <2 时，把选修课号 101–123 迁到 1101–1123。 */
  v?: number
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

function blankState(): State {
  return { startDate: todayStr(), completed: {}, checkins: [], cards: {}, wrong: {}, cases: [], teach: {}, tasks: {}, v: 2 }
}

const OLD_ELECTIVE = (n: number) => Number.isInteger(n) && n >= 101 && n <= 123

/** 键是纯天数，或「天数-…」「天数:…」时，把 101–123 加上 1000。 */
function shiftDayKey(key: string): string {
  const m = /^(\d+)(.*)$/.exec(key)
  if (!m || String(Number(m[1])) !== m[1]) return key
  const n = Number(m[1])
  if (!OLD_ELECTIVE(n)) return key
  if (m[2] !== '' && !m[2].startsWith('-') && !m[2].startsWith(':')) return key
  return `${n + 1000}${m[2]}`
}

function shiftDays<T>(rec: Record<number, T> | undefined): Record<number, T> {
  const out: Record<number, T> = {}
  for (const [k, v] of Object.entries(rec ?? {})) {
    const n = Number(k)
    if (String(n) === k && OLD_ELECTIVE(n)) out[n + 1000] = v
    else if (String(n) === k) out[n] = v
  }
  return out
}

function shiftWrong(wrong: Record<string, WrongQ> | undefined): Record<string, WrongQ> {
  const out: Record<string, WrongQ> = {}
  for (const [k, w] of Object.entries(wrong ?? {})) {
    const day = OLD_ELECTIVE(w.day) ? w.day + 1000 : w.day
    out[shiftDayKey(k)] = { ...w, day }
  }
  return out
}

function shiftCards(cards: Record<string, Card> | undefined): Record<string, Card> {
  const out: Record<string, Card> = {}
  for (const [k, v] of Object.entries(cards ?? {})) out[shiftDayKey(k)] = v
  return out
}

/** 旧存档里 101–123 都是选修。进阶课用这些号是后来的事，所以整段搬到 1101–1123。已是 v≥2 的不再搬。 */
export function migrateState(raw: Partial<State> = {}): State {
  const s: State = {
    ...blankState(),
    ...raw,
    completed: { ...(raw.completed ?? {}) },
    checkins: [...(raw.checkins ?? [])],
    cards: { ...(raw.cards ?? {}) },
    wrong: { ...(raw.wrong ?? {}) },
    cases: [...(raw.cases ?? [])],
    teach: { ...(raw.teach ?? {}) },
    tasks: { ...(raw.tasks ?? {}) },
    freeRead: raw.freeRead ? { ...raw.freeRead } : undefined,
    v: raw.v,
  }
  if ((s.v ?? 0) >= 2) return s
  s.completed = shiftDays(s.completed)
  s.freeRead = s.freeRead ? shiftDays(s.freeRead) : undefined
  s.teach = shiftDays(s.teach)
  s.tasks = shiftDays(s.tasks)
  s.wrong = shiftWrong(s.wrong)
  s.cards = shiftCards(s.cards)
  s.v = 2
  return s
}

function load(): State {
  try {
    if (typeof localStorage === 'undefined') return blankState()
    const raw = localStorage.getItem(KEY)
    if (raw) return migrateState(JSON.parse(raw) as Partial<State>)
  } catch { /* 数据损坏时重新开始 */ }
  return blankState()
}

let state: State = load()
const listeners = new Set<() => void>()
const persist = () => { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state)) }
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
const lessonDays = new Set(LESSONS.map((l) => l.day))

export function scheduleInfo(s: State, today = todayStr()) {
  const dayByCalendar = Math.min(TOTAL_DAYS, daysBetween(s.startDate, today) + 1)
  const done = (d: number) => Boolean(s.completed[d])
  const missed: number[] = []
  for (let d = 1; d < dayByCalendar; d++) if (lessonDays.has(d) && !done(d)) missed.push(d)
  const todayLesson = !lessonDays.has(dayByCalendar) || done(dayByCalendar) ? null : dayByCalendar
  let next = 1
  while (next <= TOTAL_DAYS && (done(next) || !lessonDays.has(next))) next++
  return {
    dayByCalendar, missed, todayLesson, next: next > TOTAL_DAYS ? null : next,
    doneCount: Object.keys(s.completed).filter((d) => lessonDays.has(Number(d))).length,
  }
}

export function saveTeach(day: number, text: string, ticks: number[]) {
  update((s) => { s.teach[day] = { text, ticks: [...ticks] } })
}
export function saveTasks(day: number, ticks: number[]) {
  update((s) => { s.tasks[day] = [...ticks] })
}

export function completeLesson(day: number) {
  update((s) => {
    const t = todayStr()
    if (!s.completed[day]) s.completed[day] = t
    if (!s.checkins.includes(t)) s.checkins.push(t)
  })
}

export const isRead = (s: State, day: number) => Boolean(s.completed[day] || s.freeRead?.[day])

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
export const isOnboarded = (s: State) => Boolean(s.onboarded || Object.keys(s.completed).length || Object.keys(s.freeRead ?? {}).length)
export const setStartDate = (d: string) => update((s) => { s.startDate = d })
