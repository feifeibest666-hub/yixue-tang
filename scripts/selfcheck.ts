import { HEXAGRAMS, TRIGRAMS } from '../src/data/bagua'
import { BAIHUA } from '../src/data/baihua'
import { ALL_LESSONS, ELECTIVES, LESSONS, guaLessonDay, guaOfDay, lessonByDay } from '../src/data/curriculum'
import { GUA_NOTES } from '../src/data/guaNotes'
import { ALL_CARDS } from '../src/data/cards'
import { castByNumber, castByTime } from '../src/lib/meihua'
import { PINYIN } from '../src/pages/Atlas'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }

ok(HEXAGRAMS.length === 64, '64 卦')
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

// 课程：主线 86 天（第 22–86 天依通行本卦序每天一卦），选修 101–123
ok(LESSONS.length === 86, '主线天数 ' + LESSONS.length)
LESSONS.forEach((l, i) => ok(l.day === i + 1 && !l.elective, '主线天数连续 ' + l.day))
for (let n = 1; n <= 64; n++) {
  const day = n <= 8 ? n + 21 : n + 22
  const l = LESSONS[day - 1]
  ok(l.title.includes(`第 ${n} 卦`) && l.screens.some((x) => x.t === 'hex' && x.n === n), `第 ${day} 天应讲第 ${n} 卦：${l.title}`)
}
for (let n = 9; n <= 64; n++) ok(Boolean(GUA_NOTES[n]?.why), '缺少卦注 ' + n)
for (let n = 1; n <= 64; n++) {
  const d = guaLessonDay(n), l = lessonByDay(d)
  ok(guaOfDay(d) === n && Boolean(l?.title.includes(`第 ${n} 卦`)), `自由学：第 ${n} 卦应映射到讲它的那一课（第 ${d} 天）`)
}
ok(LESSONS.filter((l) => guaOfDay(l.day) !== null).length === 64, '恰好 64 节读卦课')
ok(ELECTIVES.length === 23, '选修课数 ' + ELECTIVES.length)
ELECTIVES.forEach((l, i) => ok(l.day === 101 + i && Boolean(l.elective), '选修编号 ' + l.day))
ok(new Set(ALL_LESSONS.map((l) => l.day)).size === ALL_LESSONS.length, '课号唯一')
ALL_LESSONS.forEach((l) => {
  ok(l.quiz.length >= 1 && l.quiz.length <= 5, `第${l.day}课题数 ${l.quiz.length}`)
  l.quiz.forEach((q, k) => {
    ok(q.a >= 0 && q.a < q.opts.length, `第${l.day}课第${k + 1}题答案越界`)
    ok(new Set(q.opts).size === q.opts.length, `第${l.day}课第${k + 1}题选项重复`)
  })
})
ALL_CARDS.forEach((c) => ok(c.options.includes(c.answer) && new Set(c.options).size === c.options.length && c.options.length >= 2, '卡片选项 ' + c.id))
console.log(fail ? `${fail} 项失败` : '全部通过', '· 主线', LESSONS.length, '天 · 选修', ELECTIVES.length, '课 · 卡片', ALL_CARDS.length)
