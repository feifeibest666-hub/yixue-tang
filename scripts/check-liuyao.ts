import { HEXAGRAMS } from '../src/data/bagua'
import { coinEnumeration, yarrowEnumeration } from '../src/lib/dayan'
import { branchRelation, changShengAt, ganZhiOf, isChong, isGanHe, isHe, jinTui, monthWang, riChongEffect, stemRelation, xunOf } from '../src/lib/ganzhi'
import { boshuOrder, installNajia, liuQin, palaceChart, palaceOf, plateFromNumbers, readBianGua, xiantianOrder } from '../src/lib/liuyao'

let fail = 0
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL', m) } }
const hex = (name: string) => HEXAGRAMS.find((h) => h.name === name)!

const chart = palaceChart()
ok(chart.length === 8, '八宫 ' + chart.length)
ok(chart.every((row) => row.slots.length === 8), '每宫 8 卦')
const all = chart.flatMap((row) => row.slots)
ok(new Set(all.map((s) => s.hex.n)).size === 64, '八宫盖住 64 卦')
ok(all.every((s) => (s.shi > 3 ? s.shi - 3 : s.shi + 3) === s.ying), '应 = 世±3')

const gou = palaceOf(hex('姤'))
ok(gou.palace === '乾' && gou.generation === '一世' && gou.shi === 1 && gou.ying === 4, `姤 ${gou.palace}${gou.generation} 世${gou.shi}应${gou.ying}`)
const gouLine = installNajia(hex('姤')).map((cell) => `${cell.gz}${cell.element}${liuQin('金', cell.element)}`)
ok(gouLine.join(' ') === '辛丑土父母 辛亥水子孙 辛酉金兄弟 壬午火官鬼 壬申金兄弟 壬戌土父母', gouLine.join(' '))
const gouPlate = plateFromNumbers([8, 7, 7, 7, 7, 7], new Date(2026, 10, 21, 12, 0, 0))
ok(gouPlate.ben.name === '姤' && gouPlate.lines[0].shi && gouPlate.lines[3].ying, '姤排盘世初应四')
ok(gouPlate.lines.map((l) => `${l.gz}${l.element}${l.qin}`).join(' ') === gouLine.join(' '), '姤排盘纳甲')

const you = palaceOf(hex('大有'))
ok(you.palace === '乾' && you.generation === '归魂' && you.shi === 3 && you.hex.fullName === '火天大有', `大有 ${you.palace}${you.generation} 世${you.shi} ${you.hex.fullName}`)

const tai = palaceOf(hex('泰'))
ok(tai.palace === '坤' && tai.generation === '三世' && tai.hex.fullName === '地天泰', `泰 ${tai.palace}${tai.generation}`)
ok(installNajia(hex('泰')).map((c) => c.gz).join(' ') === '甲子 甲寅 甲辰 癸丑 癸亥 癸酉', installNajia(hex('泰')).map((c) => c.gz).join(' '))

const tong = palaceOf(hex('同人'))
ok(tong.palace === '离' && tong.generation === '归魂' && tong.hex.fullName === '天火同人', `同人 ${tong.palace}${tong.generation} ${tong.hex.fullName}`)

const yi = palaceOf(hex('颐'))
ok(yi.palace === '巽' && yi.generation === '游魂' && yi.shi === 4 && yi.hex.fullName === '山雷颐', `颐 ${yi.palace}${yi.generation} 世${yi.shi}`)

const yarrow = yarrowEnumeration()
ok(yarrow.total === 64, '大衍穷举 ' + yarrow.total)
ok(yarrow.counts[6] === 4 && yarrow.counts[7] === 20 && yarrow.counts[8] === 28 && yarrow.counts[9] === 12, `大衍 ${JSON.stringify(yarrow.counts)}`)
for (const mode of ['back3', 'char3'] as const) {
  const coin = coinEnumeration(mode)
  ok(coin.total === 8 && coin.counts[6] === 1 && coin.counts[7] === 3 && coin.counts[8] === 3 && coin.counts[9] === 1, `铜钱 ${mode} ${JSON.stringify(coin.counts)}`)
}

const sui = readBianGua([6, 8, 9, 6, 6, 9])
ok(sui.ben.name === '艮' && sui.zhi.name === '随' && sui.count === 5, `艮之随 ${sui.ben.name}之${sui.zhi.name} ${sui.count}`)
ok(sui.texts.length === 1 && sui.texts[0].from === '之卦' && sui.texts[0].text === hex('随').yao[1], '艮之随 → ' + sui.texts.map((t) => t.text).join('|'))

const bi = readBianGua([9, 8, 8, 8, 7, 8])
ok(bi.ben.name === '屯' && bi.zhi.name === '比' && bi.count === 1, `屯之比 ${bi.ben.name}之${bi.zhi.name}`)
ok(bi.texts.length === 1 && bi.texts[0].from === '本卦' && bi.texts[0].text === hex('屯').yao[0], '屯之比 → ' + bi.texts[0]?.text)

const yu = readBianGua([9, 8, 8, 6, 9, 8])
ok(yu.ben.name === '屯' && yu.zhi.name === '豫' && yu.count === 3, `屯之豫 ${yu.ben.name}之${yu.zhi.name} ${yu.count}`)
ok(yu.texts.length === 2 && yu.texts[0].text === hex('屯').guaci && yu.texts[1].text === hex('豫').guaci && yu.texts[0].role === '贞' && yu.texts[1].role === '悔', '屯之豫卦辞 ' + yu.texts.map((t) => t.role).join(','))

ok(xunOf('甲子').kong.join('') === '戌亥', '甲子旬空')
ok(xunOf('甲午').kong.join('') === '辰巳' && xunOf('甲寅').kong.join('') === '子丑', '旬空')
ok(isChong('子', '午') && isHe('子', '丑') && !isChong('子', '丑'), '冲合')
ok(branchRelation('寅', '巳').title.includes('相刑') && branchRelation('寅', '巳').title.includes('六害'), '寅巳刑而且害')
ok(branchRelation('申', '子').title.includes('三合'), '申子半合')
ok(isGanHe('甲', '己') && stemRelation('甲', '己').title === '甲己合', '甲己合')
ok(jinTui('亥', '子') === '化进' && jinTui('子', '亥') === '化退' && jinTui('丑', '辰') === '化进' && jinTui('辰', '丑') === '化退' && jinTui('子', '丑') === null, '进退')
const mu = changShengAt('木', '亥')
const muMao = changShengAt('木', '卯')
const tu = changShengAt('土', '申')
ok(mu.stage === '长生' && muMao.stage === '帝旺' && tu.stage === '长生' && tu.convention, `长生 ${mu.stage}/${muMao.stage}/${tu.stage}`)
ok(monthWang('寅', '木').state === '旺' && monthWang('寅', '火').state === '相' && monthWang('寅', '土').state === '死', '寅月旺衰')
ok(riChongEffect(false, '旺') === '暗动' && riChongEffect(false, '相') === '日破' && riChongEffect(true, '旺') === '日破', '暗动日破')

const spring = ganZhiOf(new Date(2024, 1, 4, 16, 30, 0))
const before = ganZhiOf(new Date(2024, 1, 3, 12, 30, 0))
ok(spring.monthZhi === '寅' && before.monthZhi === '丑' && spring.year === '甲辰', `节气月 ${before.monthZhi}→${spring.monthZhi} ${spring.year}`)
const late = ganZhiOf(new Date(2024, 1, 4, 23, 30, 0))
ok(late.day === '己亥' && late.time === '甲子', `晚子 ${late.day} ${late.time}`)

const bo = boshuOrder()
ok(bo.length === 64 && bo[0].name === '乾' && bo[1].lower.name === '坤' && bo[1].upper.name === '乾' && bo[2].lower.name === '艮' && bo[2].upper.name === '乾', `帛书 ${bo.slice(0, 3).map((h) => h.name).join('')}`)
const xt = xiantianOrder()
ok(xt.length === 64 && xt[0].name === '乾' && xt[1].name === '夬' && xt[63].name === '坤' && xt[31].name === '复' && xt[32].name === '姤', `先天 ${xt[0].name}${xt[1].name}…${xt[31].name}/${xt[32].name}…${xt[63].name}`)

const qianZhi = plateFromNumbers([9, 9, 9, 9, 9, 9], new Date(2024, 1, 4, 16, 0, 0))
ok(qianZhi.ben.name === '乾' && qianZhi.zhi.name === '坤' && readBianGua([9, 9, 9, 9, 9, 9]).texts[0].text.startsWith('用九'), '乾用九')

console.log(fail ? `${fail} 项失败` : '全部通过')
if (fail) process.exit(1)
