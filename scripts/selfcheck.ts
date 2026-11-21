import { HEXAGRAMS, TRIGRAMS } from '../src/data/bagua'
import { SHUOGUA, TUAN, WENYAN, XICI_SHANG, XICI_XIA, XIANG_DA, XIANG_XIAO, XUGUA, ZAGUA } from '../src/data/yizhuan'
import { ZHOUYI_TEXT } from '../src/data/zhouyiText'
import { normalizeQuote } from './check-quotes'
import { BAIHUA } from '../src/data/baihua'
import { ADV_UNITS, ALL_LESSONS, ELECTIVES, LESSONS, MAIN_DAYS, WIDGET_NAMES, guaLessonDay, guaOfDay, lessonByDay, unitDayRange } from '../src/data/curriculum'
import { GUA_NOTES } from '../src/data/guaNotes'
import { ALL_CARDS } from '../src/data/cards'
import { castByNumber, castByTime } from '../src/lib/meihua'
import { PINYIN } from '../src/pages/Atlas'
import { checkQuotes, corpusWithYizhuan } from './check-quotes'
import { migrateState } from '../src/lib/store'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }

ok(HEXAGRAMS.length === 64, '64 卦')
ok(TUAN.length === 64 && XIANG_DA.length === 64 && XIANG_XIAO.length === 64, '十翼卦数')
ok(TUAN[0].startsWith('大哉乾元'), '乾彖起笔')
{
  let xiao = 0
  XIANG_XIAO.forEach((arr, i) => {
    const expect = i < 2 ? 7 : 6
    ok(arr.length === expect, `${ZHOUYI_TEXT[i].name} 小象 ${arr.length}`)
    xiao += arr.length
    ok(normalizeQuote(XIANG_DA[i]) === normalizeQuote(ZHOUYI_TEXT[i].xiang), `大象与经文不一致 ${ZHOUYI_TEXT[i].name}`)
  })
  ok(xiao === 386, '小象合计 ' + xiao)
}
ok(XICI_SHANG.length === 12 && XICI_XIA.length === 12 && XICI_SHANG.every((c) => c.length > 0) && XICI_XIA.every((c) => c.length > 0), '系辞 12+12 章')
ok(SHUOGUA.length === 11 && SHUOGUA.every((c) => c.length > 0), '说卦 11 章')
ok(WENYAN.qian.length > 0 && WENYAN.kun.length > 0, '文言乾坤')
ok(XUGUA.shang.length > 0 && XUGUA.xia.length > 0 && ZAGUA.length > 0, '序卦杂卦')
ok(XICI_SHANG[8].join('').includes('大衍之数五十') && XICI_XIA[11][0].startsWith('夫乾，天下之至健'), '系辞分章落点')
ok(new Set(HEXAGRAMS.map((h) => h.lines.join(''))).size === 64, '卦画唯一')
ok(PINYIN.length === 64, '拼音 64 个: ' + PINYIN.length)
HEXAGRAMS.forEach((h, i) => {
  const expect = h.n <= 2 ? 7 : 6
  ok(h.yao.length === expect, `${h.name} 爻辞条数 ${h.yao.length}`)
  ok(h.yaoBai.length === expect, `${h.name} 白话条数 ${h.yaoBai.length}`)
  h.yao.slice(0, 6).forEach((y, k) => {
    const t = (k === 0 ? '初' : k === 5 ? '上' : '') + (h.lines[k] ? '九' : '六') + (k > 0 && k < 5 ? '二三四五'[k - 1] : '')
    ok(y.startsWith(t + '：'), `${h.name} 第${k + 1}爻 爻题应为 ${t}：${y}`)
  })
  ok(BAIHUA[i].yao.length === 6, `${h.name} baihua`)
})
ok(HEXAGRAMS[0].yao[6].startsWith('用九') && HEXAGRAMS[1].yao[6].startsWith('用六'), '用九用六')
// King Wen 卦序 spot checks
const names = '乾坤屯蒙需讼师比'.split('')
names.forEach((n, i) => ok(HEXAGRAMS[i].name === n, '卦序 ' + n))
ok(HEXAGRAMS[10].fullName === '地天泰' && HEXAGRAMS[11].fullName === '天地否' && HEXAGRAMS[62].fullName === '水火既济', '全名')
ok(TRIGRAMS.map((t) => t.xiantianNum).join('') === '12345678', '先天数')

// 观梅占：辰年十二月十七日申时 → 用数字法复现：上卦数 34，下卦数 43，动爻 43%6
const g = castByNumber(34, 9, false)
ok(g.ben.upper.name === '兑' && g.ben.lower.name === '乾', '数字法 34,9 → 兑上乾下 ' + g.ben.fullName)
const r = castByNumber(34, 43 - 34 + 34, false) // 34, 43
ok(r.ben.name === '革', '34/43 本卦革 got ' + r.ben.name)
// 动爻 (34+43)%6=77%6=5
ok(r.moving === 5, 'moving ' + r.moving)
// 时间起卦：找一个辰年腊月十七申时（2025-01-16 为甲辰年腊月十七）
const t = castByTime({ date: new Date(2025, 0, 16, 16, 0), lateZiNextDay: false })
console.log(t.steps.slice(0, 5).join('\n'))
ok(t.ben.name === '革' && t.moving === 1 && t.hu.name === '姤' && t.bian.name === '咸', `观梅占 ${t.ben.name} ${t.moving} ${t.hu.name} ${t.bian.name}`)
ok(t.ti.name === '兑' && t.yong.name === '离' && t.relation === '用克体', '观梅 体用 ' + t.relation)

// 课程：主线 86 天（第 22–86 天依通行本卦序每天一卦），选修 1101–1123；进阶课写进来之后另查
const main = LESSONS.filter((l) => l.day <= MAIN_DAYS)
ok(main.length === MAIN_DAYS, '主线天数 ' + main.length)
for (let d = 1; d <= MAIN_DAYS; d++) {
  const l = LESSONS.find((x) => x.day === d)
  ok(Boolean(l && l.day === d && !l.elective), '主线天数连续 ' + d)
}
for (let n = 1; n <= 64; n++) {
  const day = n <= 8 ? n + 21 : n + 22
  const l = LESSONS.find((x) => x.day === day)
  ok(Boolean(l && l.title.includes(`第 ${n} 卦`) && l.screens.some((x) => x.t === 'hex' && x.n === n)), `第 ${day} 天应讲第 ${n} 卦：${l?.title}`)
}
for (let n = 9; n <= 64; n++) ok(Boolean(GUA_NOTES[n]?.why), '缺少卦注 ' + n)
for (let n = 1; n <= 64; n++) {
  const d = guaLessonDay(n), l = lessonByDay(d)
  ok(guaOfDay(d) === n && Boolean(l?.title.includes(`第 ${n} 卦`)), `自由学：第 ${n} 卦应映射到讲它的那一课（第 ${d} 天）`)
}
ok(LESSONS.filter((l) => guaOfDay(l.day) !== null).length === 64, '恰好 64 节读卦课')
ok(guaOfDay(30) === null && guaOfDay(21) === null && guaOfDay(MAIN_DAYS + 1) === null && guaOfDay(86) === 64, 'guaOfDay 只认 22–29 与 31–86')
ok(ELECTIVES.length === 23, '选修课数 ' + ELECTIVES.length)
ELECTIVES.forEach((l, i) => ok(l.day === 1101 + i && Boolean(l.elective), '选修编号 ' + l.day))
ok(ELECTIVES[0]?.elective === '原理 1' && ELECTIVES[12]?.elective === '原理 13' && ELECTIVES[13]?.elective === '梅花 1' && ELECTIVES[22]?.elective === '梅花 10', '选修标签')
ok(new Set(ALL_LESSONS.map((l) => l.day)).size === ALL_LESSONS.length, '课号唯一')

ok(ADV_UNITS.length === 17, '进阶阶段数 ' + ADV_UNITS.length)
let prevEnd = MAIN_DAYS
ADV_UNITS.forEach((u, i) => {
  ok(u.id === `a${i + 1}`, '阶段 id ' + u.id)
  const r = unitDayRange(u)
  ok(Boolean(r && r[0] === prevEnd + 1), `${u.id} 起点 ${r?.[0]}`)
  if (r) prevEnd = r[1]
})
ok(prevEnd === 730, '进阶收到第 730 天 ' + prevEnd)

const widgetSet = new Set<string>(WIDGET_NAMES)
const adv = LESSONS.filter((l) => l.day > MAIN_DAYS)
const advDays = new Set<number>()
for (const l of adv) {
  ok(!advDays.has(l.day), `进阶课号重复 ${l.day}`)
  advDays.add(l.day)
  const u = ADV_UNITS.find((x) => x.id === l.unit)
  ok(Boolean(u), `进阶单元无效 ${l.unit}（第 ${l.day} 天）`)
  const r = u ? unitDayRange(u) : null
  ok(Boolean(r && l.day >= r[0] && l.day <= r[1]), `第 ${l.day} 天不在 ${l.unit} 的范围里`)
  ok((l.quiz?.length ?? 0) >= 3, `进阶第 ${l.day} 课题数 ${l.quiz.length}`)
  if (l.kind === '新') {
    ok(l.quiz.length >= 4, `新课第 ${l.day} 天应至少 4 题，现有 ${l.quiz.length}`)
    ok((l.qa?.length ?? 0) >= 2, `新课第 ${l.day} 天应至少 2 条问答，现有 ${l.qa?.length ?? 0}`)
  }
}

ALL_LESSONS.forEach((l) => {
  const isAdv = l.day > MAIN_DAYS && !l.elective
  if (!isAdv) ok(l.quiz.length >= 1 && l.quiz.length <= 5, `第${l.day}课题数 ${l.quiz.length}`)
  l.quiz.forEach((q, k) => {
    ok(q.a >= 0 && q.a < q.opts.length, `第${l.day}课第${k + 1}题答案越界`)
    ok(new Set(q.opts).size === q.opts.length, `第${l.day}课第${k + 1}题选项重复`)
  })
  l.screens.forEach((s) => {
    if (s.t === 'widget') ok(widgetSet.has(s.w), `第${l.day}课 widget 无效：${s.w}`)
  })
})
ALL_CARDS.forEach((c) => ok(c.options.includes(c.answer) && new Set(c.options).size === c.options.length && c.options.length >= 2, '卡片选项 ' + c.id))

const migrated = migrateState({
  startDate: '2026-01-01',
  completed: { 1: '2026-01-01', 101: '2026-01-02', 123: '2026-01-03' },
  checkins: [],
  cards: {
    'bg-乾-name': { box: 1, due: '2026-01-01', lapses: 0, seen: 1 },
    '101': { box: 2, due: '2026-01-01', lapses: 0, seen: 1 },
    '114-x': { box: 3, due: '2026-01-01', lapses: 0, seen: 1 },
  },
  wrong: {
    '101-0': { day: 101, idx: 0, count: 2, last: '2026-01-02' },
    '5-1': { day: 5, idx: 1, count: 1, last: '2026-01-01' },
  },
  cases: [],
  teach: { 110: { text: '旧讲解', ticks: [0] } },
  tasks: { 123: [1, 2] },
  freeRead: { 102: '2026-01-04' },
})
ok(migrated.v === 2, '迁移后 v=2')
ok(migrated.completed[1] === '2026-01-01' && migrated.completed[1101] === '2026-01-02' && migrated.completed[1123] === '2026-01-03' && migrated.completed[101] === undefined, 'completed 101–123 → +1000')
ok(migrated.freeRead?.[1102] === '2026-01-04' && migrated.freeRead?.[102] === undefined, 'freeRead 迁移')
ok(migrated.wrong['1101-0']?.day === 1101 && migrated.wrong['1101-0']?.count === 2 && !migrated.wrong['101-0'] && migrated.wrong['5-1']?.day === 5, '错题键和 day 一起迁')
ok(migrated.teach[1110]?.text === '旧讲解' && migrated.teach[110] === undefined, 'teach 迁移')
ok(migrated.tasks[1123]?.join() === '1,2' && migrated.tasks[123] === undefined, 'tasks 迁移')
ok(migrated.cards['bg-乾-name']?.box === 1 && migrated.cards['1101']?.box === 2 && migrated.cards['1114-x']?.box === 3 && migrated.cards['101'] === undefined, '按天编号的卡片键才迁')
const kept = migrateState({ ...migrated, completed: { ...migrated.completed, 101: '进阶' } })
ok(kept.v === 2 && kept.completed[101] === '进阶' && kept.completed[1101] === '2026-01-02', 'v=2 不再搬动 101')

const corpus = await corpusWithYizhuan()
checkQuotes(ALL_LESSONS, ok, corpus)
console.log(fail ? `${fail} 项失败` : '全部通过', '· 主线', main.length, '天 · 进阶', adv.length, '课 · 选修', ELECTIVES.length, '课 · 卡片', ALL_CARDS.length)
