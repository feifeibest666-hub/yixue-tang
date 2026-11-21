/**
 * 选修课号 101–123 → 1101–1123 的存档迁移。
 * 用「已学完现行线上课程」的 localStorage 形状（origin/main 的 State，没有 v）：
 * 主线 1–86 全部完成、选修 101–123 全部完成、打卡连续天数、错题、卡片、占例、旧 freeRead。
 * 另加 teach/tasks：它们和迁移同一批才写入，线上旧档没有，但键也是按天的，一并核对。
 *
 * 本文件必须先于 store.ts 装好 localStorage，再动态 import，才能走到真实的 load()+persist()。
 * 第二次启动用子进程：已经迁过、并且又学完进阶第 101 天的档，打开后不能再搬一次。
 */
import { spawnSync } from 'node:child_process'
import { ELECTIVES, LESSONS, UNITS, lessonByDay } from '../src/data/curriculum'

const KEY = 'zhouyi-xuexi-v1'
const TODAY = '2026-11-21'
const START = '2026-08-01'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }

const add = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function installLocalStorage(initial: string | null) {
  const mem = new Map<string, string>()
  if (initial !== null) mem.set(KEY, initial)
  const ls = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, String(v)) },
    removeItem: (k: string) => { mem.delete(k) },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true, writable: true })
}

/** 和线上一致的对象键顺序：完成日、打卡按时间先后写入。 */
function finishedCourseSave() {
  const completed: Record<string, string> = {}
  for (let day = 1; day <= 86; day++) completed[String(day)] = add(START, day - 1)
  for (let day = 101; day <= 123; day++) completed[String(day)] = add('2026-10-26', day - 101)
  const checkins = [...new Set([...Object.values(completed), '2026-11-19', '2026-11-20', TODAY])]
  const card = (box: number, due: string, lapses: number, seen: number) => ({ box, due, lapses, seen })
  return {
    startDate: START,
    onboarded: true,
    completed,
    checkins,
    cards: {
      'bg-乾-name': card(4, '2026-12-01', 0, 6),
      'bg-坤-nature': card(1, '2026-11-01', 2, 4),
      'g-1-name': card(2, TODAY, 1, 3),
      'g-11-full': card(3, '2026-11-20', 0, 3),
      'g-63-name': card(0, '2026-10-01', 1, 1),
      'g-64-full': card(5, '2026-12-15', 0, 8),
    },
    wrong: {
      '1-0': { day: 1, idx: 0, count: 1, last: '2026-08-01' },
      '45-2': { day: 45, idx: 2, count: 3, last: '2026-09-14' },
      '86-2': { day: 86, idx: 2, count: 1, last: '2026-10-25' },
      '101-0': { day: 101, idx: 0, count: 2, last: '2026-10-26' },
      '113-2': { day: 113, idx: 2, count: 1, last: '2026-11-07' },
      '114-1': { day: 114, idx: 1, count: 4, last: '2026-11-08' },
      '123-0': { day: 123, idx: 0, count: 1, last: '2026-11-17' },
    },
    cases: [
      {
        id: 'm1', createdAt: '2026-09-01T08:00:00.000Z', question: '这周的计划能否做完',
        method: 'time', inputLabel: '2026-09-01 08:00',
        params: { time: '2026-09-01T08:00', lateZi: false },
        benN: 49, huN: 44, bianN: 31, moving: 1, ti: '兑', yong: '离', relation: '用克体',
        myJudgement: '先看体用', outcome: '做完了', review: '应期偏早',
      },
      {
        id: 'm2', createdAt: '2026-10-02T03:12:00.000Z', question: '（未填写所问之事）',
        method: 'number', inputLabel: '34 / 43',
        params: { a: 34, b: 43, addHour: false },
        benN: 49, huN: 44, bianN: 31, moving: 5, ti: '兑', yong: '离', relation: '用克体',
        myJudgement: '', outcome: '', review: '',
      },
    ],
    freeRead: { 22: '2026-08-22', 51: '2026-09-20', 86: '2026-10-25', 109: '2026-11-03', 120: '2026-11-14' },
    teach: {
      42: { text: '主线第 42 天的讲解', ticks: [0, 2] },
      101: { text: '原理 1 的讲解', ticks: [1] },
      123: { text: '梅花 10 的讲解', ticks: [0, 1, 2] },
    },
    tasks: { 7: [0], 114: [1, 2], 123: [0, 3] },
  }
}

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.keys(o).sort().reduce<Record<string, unknown>>((acc, k) => { acc[k] = canon(o[k]); return acc }, {})
  }
  return v
}
const same = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b))

function countKeys(rec: Record<string, unknown> | undefined) {
  return Object.keys(rec ?? {}).length
}

async function bootFinishedCourse() {
  const old = finishedCourseSave()
  ok(add(START, 85) === '2026-10-25', '第 86 天完成日')
  ok(add('2026-10-26', 22) === '2026-11-17', '选修最后一天')
  ok(!old.checkins.includes('2026-11-18'), '11-18 是断档')
  installLocalStorage(JSON.stringify(old))

  const store = await import('../src/lib/store.ts')
  const s = store.getState()
  const persisted = JSON.parse(localStorage.getItem(KEY) ?? 'null') as typeof s

  ok(s.v === 2 && persisted.v === 2, '迁移后写入 v=2')
  ok(s.startDate === START && s.onboarded === true, '开学日和已进入过应用都还在')
  ok(countKeys(s.completed) === 86 + 23, `完成记录条数 ${countKeys(s.completed)}`)
  ok(new Set(Object.keys(s.completed)).size === 86 + 23, '完成记录没有重复键')

  for (let day = 1; day <= 86; day++) {
    ok(s.completed[day] === old.completed[String(day)], `主线第 ${day} 天完成日被改动`)
    ok(Boolean(s.completed[day]), `主线第 ${day} 天丢失`)
  }
  for (let day = 101; day <= 123; day++) {
    ok(s.completed[day] === undefined, `旧选修 ${day} 还留在进阶课号上`)
    ok(s.completed[day + 1000] === old.completed[String(day)], `选修 ${day} 没有搬到 ${day + 1000}`)
    const lesson = lessonByDay(day + 1000)
    ok(Boolean(lesson?.elective), `${day + 1000} 应该是选修课`)
    ok(!lessonByDay(day)?.elective, `第 ${day} 天不该再是选修`)
    ok(store.isRead(s, day) === false, `第 ${day} 天被当成已学`)
    ok(store.isRead(s, day + 1000) === true, `选修 ${day + 1000} 被当成没学`)
  }
  ok(lessonByDay(1101)?.elective === '原理 1' && lessonByDay(1113)?.elective === '原理 13', '原理课号')
  ok(lessonByDay(1114)?.elective === '梅花 1' && lessonByDay(1123)?.elective === '梅花 10', '梅花课号')
  ok(ELECTIVES.filter((l) => l.unit === 'x1' && s.completed[l.day]).length === 13, '原理完成 13')
  ok(ELECTIVES.filter((l) => l.unit === 'x2' && s.completed[l.day]).length === 10, '梅花完成 10')
  for (const u of UNITS) {
    const ls = LESSONS.filter((l) => l.unit === u.id)
    ok(ls.length > 0 && ls.every((l) => s.completed[l.day] === old.completed[String(l.day)]), `${u.name} 完成记录`)
  }
  ok(LESSONS.filter((l) => l.day >= 87 && l.day <= 730 && s.completed[l.day]).length === 0, '没有一条进阶课被标成已完成')

  const info = store.scheduleInfo(s, TODAY)
  ok(info.doneCount === 86, `日程完成数是 ${info.doneCount}，选修不该算进去，也没有少算主线`)
  ok(info.missed.every((d) => !s.completed[d]), '已完成的日子出现在待补里')
  for (let day = 101; day <= 123; day++) {
    if (LESSONS.some((l) => l.day === day) && day < info.dayByCalendar) {
      ok(info.missed.includes(day), `进阶第 ${day} 天被旧选修记录挡住，没有出现在待补里`)
    }
  }

  const streakNow = store.streak(s, TODAY)
  const streakOld = store.streak({ ...s, checkins: old.checkins }, TODAY)
  ok(same(s.checkins, old.checkins), '打卡日期被改动')
  ok(streakNow === 3 && streakNow === streakOld, `连续打卡 ${streakNow}，迁移前是 ${streakOld}`)
  ok(store.streak(s, '2026-11-18') === store.streak({ ...s, checkins: old.checkins }, '2026-11-18'), '断档那天的连续天数不一致')

  ok(s.freeRead?.[22] === '2026-08-22' && s.freeRead?.[51] === '2026-09-20' && s.freeRead?.[86] === '2026-10-25', '主线 freeRead 被搬走')
  ok(s.freeRead?.[109] === undefined && s.freeRead?.[1109] === '2026-11-03', '选修 freeRead')
  ok(s.freeRead?.[120] === undefined && s.freeRead?.[1120] === '2026-11-14', '选修 freeRead 120')
  ok(countKeys(s.freeRead) === 5, 'freeRead 条数')

  ok(same(s.cards, old.cards), '卡片键或盒子被改动（八卦/六十四卦卡片不按天编号）')
  const due = store.dueCards(s, TODAY).sort()
  ok(same(due, ['bg-坤-nature', 'g-1-name', 'g-11-full', 'g-63-name']), `到期卡片 ${due.join(',')}`)
  ok(same(store.wrongCards(s).sort(), ['bg-坤-nature', 'g-1-name', 'g-63-name']), '错卡集合变了')

  for (const [from, to] of [['101-0', '1101-0'], ['113-2', '1113-2'], ['114-1', '1114-1'], ['123-0', '1123-0']] as const) {
    ok(!s.wrong[from] && s.wrong[to]?.day === Number(to.slice(0, 4)), `错题 ${from} → ${to}`)
    ok(s.wrong[to]?.count === old.wrong[from].count && s.wrong[to]?.last === old.wrong[from].last && s.wrong[to]?.idx === old.wrong[from].idx, `错题 ${to} 内容`)
    const lesson = lessonByDay(s.wrong[to]!.day)
    ok(Boolean(lesson?.elective && lesson.quiz[s.wrong[to]!.idx]), `错题 ${to} 对不上选修课的题目`)
  }
  for (const k of ['1-0', '45-2', '86-2'] as const) {
    ok(same(s.wrong[k], old.wrong[k]), `主线错题 ${k}`)
  }
  ok(countKeys(s.wrong) === 7, '错题条数')

  ok(s.teach[42]?.text === '主线第 42 天的讲解' && same(s.teach[42]?.ticks, [0, 2]), '主线讲解')
  ok(s.teach[101] === undefined && s.teach[1101]?.text === '原理 1 的讲解' && same(s.teach[1101]?.ticks, [1]), '选修讲解')
  ok(s.teach[123] === undefined && s.teach[1123]?.text === '梅花 10 的讲解', '梅花讲解')
  ok(same(s.tasks[7], [0]) && s.tasks[114] === undefined && same(s.tasks[1114], [1, 2]) && same(s.tasks[1123], [0, 3]), '练习勾选')
  ok(countKeys(s.teach) === 3 && countKeys(s.tasks) === 3, '讲解和练习条数')

  ok(same(s.cases, old.cases), '占例被改动或换了顺序')
  ok(store.isOnboarded(s) === true, '会被当成第一次打开')

  const again = store.migrateState(JSON.parse(JSON.stringify(s)))
  ok(again.v === 2 && same(again, s), '对已迁移的存档再跑一次，内容变了')
  ok(again.completed[2101] === undefined && again.completed[1101] === old.completed['101'], '第二次把 1101 又加了 1000')

  const advanced = store.migrateState({
    ...JSON.parse(JSON.stringify(s)),
    completed: { ...s.completed, 101: '2026-11-21' },
    teach: { ...s.teach, 101: { text: '进阶第 101 天', ticks: [0] } },
    tasks: { ...s.tasks, 101: [2] },
    wrong: { ...s.wrong, '101-0': { day: 101, idx: 0, count: 1, last: '2026-11-21' } },
  })
  ok(advanced.completed[101] === '2026-11-21' && advanced.completed[1101] === old.completed['101'], 'v=2 后又学的进阶第 101 天冲掉了选修')
  ok(advanced.teach[101]?.text === '进阶第 101 天' && advanced.teach[1101]?.text === '原理 1 的讲解', '进阶讲解和选修讲解叠在一起')
  ok(same(advanced.tasks[101], [2]) && same(advanced.tasks[1114], [1, 2]), '进阶练习勾选')
  ok(advanced.wrong['101-0']?.day === 101 && advanced.wrong['1101-0']?.day === 1101, '进阶错题和选修错题')

  const boundary = store.migrateState({
    completed: { 100: 'keep-100', 101: 'move-101', 123: 'move-123', 124: 'keep-124' },
    checkins: ['2026-01-01'],
  })
  ok(boundary.completed[100] === 'keep-100' && boundary.completed[124] === 'keep-124', '100 和 124 不在选修段里')
  ok(boundary.completed[1101] === 'move-101' && boundary.completed[1123] === 'move-123', '边界 101 和 123 要搬')
  ok(boundary.completed[101] === undefined && boundary.completed[123] === undefined, '边界上的旧号还在')

  const sparse = store.migrateState({
    startDate: '2026-10-01',
    completed: { 1: '2026-10-01', 86: '2026-11-01', 101: '2026-11-02', 114: '2026-11-03' },
    checkins: ['2026-11-01', '2026-11-03', '2026-11-02'],
    freeRead: { 45: '2026-10-20', 112: '2026-11-04' },
  })
  ok(same(sparse.completed, { 1: '2026-10-01', 86: '2026-11-01', 1101: '2026-11-02', 1114: '2026-11-03' }), '只学了部分选修时多搬或少搬')
  ok(sparse.freeRead?.[45] === '2026-10-20' && sparse.freeRead?.[1112] === '2026-11-04' && sparse.freeRead?.[112] === undefined, '只读过的选修')
  ok(same(sparse.checkins, ['2026-11-01', '2026-11-03', '2026-11-02']), '打卡顺序')
  ok(countKeys(sparse.teach) === 0 && countKeys(sparse.tasks) === 0 && sparse.cases.length === 0, '旧档没有的字段被造出了按天的记录')
  ok(store.streak(sparse, '2026-11-03') === 3, '乱序打卡的连续天数')

  for (const v of [undefined, 0, 1]) {
    const one = store.migrateState({ v, completed: { 101: 'x' } })
    ok(one.v === 2 && one.completed[1101] === 'x' && one.completed[101] === undefined, `v=${String(v)} 应该迁移`)
  }
  for (const v of [2, 3]) {
    const kept = store.migrateState({ v, completed: { 101: 'advanced', 1101: 'elective' } })
    ok(kept.completed[101] === 'advanced' && kept.completed[1101] === 'elective' && kept.v === v, `v=${v} 不应该再搬`)
  }

  ok(same(persisted.completed, s.completed) && same(persisted.checkins, s.checkins) && same(persisted.cases, s.cases), '写回 localStorage 的内容和内存不一致')

  const child = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1), '--second-boot'], {
    stdio: 'inherit',
    env: { ...process.env, MIG_SAVE: JSON.stringify(persisted) },
  })
  ok(child.status === 0, `第二次打开应用失败，退出码 ${child.status}`)
  return fail
}

async function bootAlreadyMigrated() {
  const saved = JSON.parse(process.env.MIG_SAVE ?? 'null') as {
    completed: Record<string, string>
    teach: Record<string, { text: string; ticks: number[] }>
    tasks: Record<string, number[]>
    wrong: Record<string, { day: number; idx: number; count: number; last: string }>
    checkins: string[]
    v: number
  }
  const elective101 = saved.completed['1101']
  saved.completed['101'] = '2026-11-21'
  saved.teach['101'] = { text: '进阶第 101 天', ticks: [0] }
  saved.tasks['101'] = [2]
  saved.wrong['101-0'] = { day: 101, idx: 0, count: 1, last: '2026-11-21' }
  installLocalStorage(JSON.stringify(saved))
  const store = await import('../src/lib/store.ts')
  const s = store.getState()
  const persisted = JSON.parse(localStorage.getItem(KEY) ?? 'null') as typeof s
  ok(s.v === 2 && persisted.v === 2, '第二次打开仍是 v=2')
  ok(s.completed[101] === '2026-11-21', '进阶第 101 天在第二次打开时被搬走')
  ok(s.completed[1101] === elective101, '选修原理 1 在第二次打开时丢了或被覆盖')
  ok(s.completed[2101] === undefined, '1101 在第二次打开时又加了 1000')
  ok(s.teach[101]?.text === '进阶第 101 天' && s.teach[1101]?.text === '原理 1 的讲解', '第二次打开把两种讲解合成一份')
  ok(same(s.tasks[101], [2]) && same(s.tasks[1123], [0, 3]), '第二次打开练习勾选变了')
  ok(s.wrong['101-0']?.day === 101 && s.wrong['1101-0']?.day === 1101 && !s.wrong['2101-0'], '第二次打开错题键变了')
  ok(store.streak(s, TODAY) === 3, '第二次打开连续打卡变了')
  ok(store.scheduleInfo(s, TODAY).doneCount === 86 + (LESSONS.some((l) => l.day === 101) ? 1 : 0), '完成数把选修又算了一遍，或把进阶第 101 天漏了')
  ok(store.isRead(s, 1101) && store.isRead(s, 101), '第二次打开后选修或进阶已学状态丢了')
  ok(countKeys(s.completed) === 86 + 23 + 1, '第二次打开完成条数')
  console.log(fail ? `${fail} 项失败（第二次打开）` : '第二次打开通过：v=2 的档不再搬动，进阶第 101 天和选修 1101 同时保留')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--second-boot')) {
  await bootAlreadyMigrated()
} else {
  const n = await bootFinishedCourse()
  console.log(n ? `${n} 项失败` : '迁移测试通过 · 主线 86 天 · 选修 23 课 · 打卡、错题、卡片、占例、freeRead、讲解、练习都只搬一次')
  process.exit(n ? 1 : 0)
}
