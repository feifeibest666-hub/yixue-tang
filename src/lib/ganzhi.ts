/** 干支、节气月柱、冲合刑害、十二长生、月令旺衰。 */
import { Solar } from 'lunar-javascript'
import { DIZHI, wangShuai, type WuXing } from '../data/bagua'

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const ZHI = DIZHI

export const JIAZI: string[] = Array.from({ length: 60 }, (_, i) => GAN[i % 10] + ZHI[i % 12])

export function zhiElement(zhi: string): WuXing {
  if (zhi === '寅' || zhi === '卯') return '木'
  if (zhi === '巳' || zhi === '午') return '火'
  if (zhi === '申' || zhi === '酉') return '金'
  if (zhi === '亥' || zhi === '子') return '水'
  return '土'
}

const CHONG: [string, string][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]
const LIUHE: [string, string][] = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
const LIUHAI: [string, string][] = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']]
const GANHE: [string, string][] = [['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']]
const SANHE: { zhi: [string, string, string]; wx: WuXing }[] = [
  { zhi: ['申', '子', '辰'], wx: '水' },
  { zhi: ['寅', '午', '戌'], wx: '火' },
  { zhi: ['巳', '酉', '丑'], wx: '金' },
  { zhi: ['亥', '卯', '未'], wx: '木' },
]
const XING = [
  { zhi: ['寅', '巳', '申'], name: '寅巳申无恩之刑' },
  { zhi: ['丑', '戌', '未'], name: '丑戌未恃势之刑' },
]
const SELF_XING = new Set(['辰', '午', '酉', '亥'])

function pair(table: [string, string][], a: string, b: string) {
  return table.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

export const isChong = (a: string, b: string) => pair(CHONG, a, b)
export const isHe = (a: string, b: string) => pair(LIUHE, a, b)
export const isHai = (a: string, b: string) => pair(LIUHAI, a, b)
export const isGanHe = (a: string, b: string) => pair(GANHE, a, b)

/** 化进：亥子、寅卯、巳午、申酉，以及丑辰未戌顺环。反向是化退。 */
export const JIN: Record<string, string> = {
  亥: '子', 寅: '卯', 巳: '午', 申: '酉', 丑: '辰', 辰: '未', 未: '戌', 戌: '丑',
}
export const TUI: Record<string, string> = Object.fromEntries(Object.entries(JIN).map(([a, b]) => [b, a]))

export function jinTui(from: string, to: string): '化进' | '化退' | null {
  if (JIN[from] === to) return '化进'
  if (TUI[from] === to) return '化退'
  return null
}

export function xunOf(dayGZ: string): { name: string; kong: [string, string]; why: string } {
  const idx = JIAZI.indexOf(dayGZ)
  if (idx < 0) throw new Error(`不是干支：${dayGZ}`)
  const start = idx - (idx % 10)
  const startGZ = JIAZI[start]
  const z0 = ZHI.indexOf(startGZ[1])
  const kong: [string, string] = [ZHI[(z0 + 10) % 12], ZHI[(z0 + 11) % 12]]
  return {
    name: `${startGZ}旬`,
    kong,
    why: `${dayGZ}落在${startGZ}旬：从${startGZ}数十个干支，地支占满十个，空下来的是${kong[0]}和${kong[1]}，叫旬空。`,
  }
}

export interface GanZhiWhy { year: string; month: string; day: string; time: string; kong: string }
export interface GanZhiTime {
  year: string
  month: string
  day: string
  time: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  xunName: string
  kong: [string, string]
  why: GanZhiWhy
}

function lunarOf(date: Date) {
  return Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()).getLunar()
}

/** 年、月用节气交节时刻；日柱 23:00 换日。 */
export function ganZhiOf(date: Date): GanZhiTime {
  const lunar = lunarOf(date)
  const year = lunar.getYearInGanZhiExact()
  const month = lunar.getMonthInGanZhiExact()
  const monthZhi = lunar.getMonthZhiExact()
  const day = lunar.getDayInGanZhiExact()
  const time = lunar.getTimeInGanZhi()
  const xun = xunOf(day)
  return {
    year, month, day, time, monthZhi,
    dayGan: day[0], dayZhi: day[1],
    xunName: xun.name, kong: xun.kong,
    why: {
      year: `年柱按立春的交节时刻换岁，不按正月初一。此刻是${year}年。`,
      month: `月柱按节换：立春后寅月、惊蛰后卯月，用交节的时刻，不按农历初一，也不只看中气。此刻是${month}月，月建${monthZhi}。`,
      day: `日柱在 23:00 换日。23 点到 24 点仍是子时，但日柱已经进到下一天。这是多数六爻书和八字的约定；若按零点换日，这一个小时会差一天。此刻日辰是${day}。`,
      time: `时辰：23 点到 1 点子、1 点到 3 点丑，依此类推。时干从当日日干用五鼠遁推出。23 点以后日干已经换成下一天，时干跟着那天走。此刻是${time}时。`,
      kong: xun.why,
    },
  }
}

export function currentJieQi(date: Date): { name: string; why: string } {
  const jq = lunarOf(date).getPrevJieQi(false)
  const name = jq?.getName() ?? ''
  return {
    name,
    why: name
      ? `取不晚于这个时刻的上一个节气（交节当天也算），现在落在「${name}」。`
      : '这一刻没有取到节气。',
  }
}

export function monthWang(monthZhi: string, el: WuXing): { state: '旺' | '相' | '休' | '囚' | '死'; season: WuXing; why: string } {
  const season = zhiElement(monthZhi)
  const state = wangShuai(season, el)
  const how = state === '旺' ? `${el}就是这个月当令的五行`
    : state === '相' ? `${season}生${el}，当令所生为相`
    : state === '休' ? `${el}生${season}，生当令者为休`
    : state === '囚' ? `${el}克${season}，克当令者为囚`
    : `${season}克${el}，当令所克为死`
  const tu = '辰戌丑未'.includes(monthZhi) ? '辰、戌、丑、未整月都按土旺算，这是通书的约定；另有一说土只旺在每季末的十八日。' : ''
  return { state, season, why: `${monthZhi}月${season}旺。${how}，所以${el}为${state}。${tu}` }
}

/** 日冲之后：静而且旺才叫暗动，否则叫日破。 */
export function riChongEffect(moving: boolean, wang: '旺' | '相' | '休' | '囚' | '死'): '暗动' | '日破' {
  return !moving && wang === '旺' ? '暗动' : '日破'
}

export function branchRelation(a: string, b: string): { title: string; why: string } {
  if (a === b) {
    if (SELF_XING.has(a)) return { title: `${a}自刑`, why: `${a}见${a}为自刑。传统只把辰、午、酉、亥算自刑，别的地支重复不算刑。` }
    return { title: '同一支', why: `${a}和${a}相同。它不在辰午酉亥里，所以不是自刑，也说不上冲、合、害。` }
  }
  const bits: string[] = []
  const whys: string[] = []
  if (isChong(a, b)) { bits.push('六冲'); whys.push(`${a}${b}相冲，在十二支里正好对着。`) }
  if (isHe(a, b)) { bits.push('六合'); whys.push(`${a}${b}六合。六对是子丑、寅亥、卯戌、辰酉、巳申、午未。`) }
  if (isHai(a, b)) { bits.push('六害'); whys.push(`${a}${b}相害。六害是把六合的另一半冲开：比如子丑合，未冲丑，于是子未害。`) }
  const xing = XING.find((g) => g.zhi.includes(a) && g.zhi.includes(b))
  if (xing) { bits.push('相刑'); whys.push(`${a}和${b}都在${xing.name}里。这三支里任意两支都算刑。`) }
  if ((a === '子' && b === '卯') || (a === '卯' && b === '子')) { bits.push('相刑'); whys.push('子卯是无礼之刑，两支互相刑。') }
  const san = SANHE.find((g) => g.zhi.includes(a) && g.zhi.includes(b))
  if (san) {
    const missing = san.zhi.find((z) => z !== a && z !== b)
    bits.push('三合')
    whys.push(`${san.zhi.join('')}合${san.wx}。${a}和${b}只到了两支，叫半合，还缺${missing}。`)
  }
  if (!bits.length) return { title: '无冲合刑害', why: `${a}和${b}不构成六冲、六合、六害、三刑或三合。` }
  return { title: bits.join(' · '), why: whys.join('') }
}

export function stemRelation(a: string, b: string): { title: string; why: string } {
  if (a === b) return { title: '同一干', why: `${a}和${a}相同。天干五合是甲己、乙庚、丙辛、丁壬、戊癸，没有自己和自己合。` }
  if (isGanHe(a, b)) return { title: `${a}${b}合`, why: `天干五合：甲己合、乙庚合、丙辛合、丁壬合、戊癸合。${a}与${b}是其中一对。` }
  return { title: '不相合', why: `${a}与${b}不在天干五合里。` }
}

export const CS_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const
const CS_START: Record<WuXing, string> = { 木: '亥', 火: '寅', 金: '巳', 水: '申', 土: '申' }

export function changShengAt(el: WuXing, zhi: string): { stage: string; start: string; convention: boolean; why: string } {
  const start = CS_START[el]
  const step = (ZHI.indexOf(zhi) - ZHI.indexOf(start) + 12) % 12
  const stage = CS_STAGES[step]
  const convention = el === '土'
  const why = convention
    ? `土的长生放在申，和水走同一张表。这是「土寄生于申」的约定，不是从土自己推出来的。从申顺数到${zhi}，是${stage}。另有按天干分阴阳、阴干逆行的长生，这里不用。`
    : `${el}长生在${start}。从长生起沿地支顺行十二步：长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养。${zhi}是第 ${step + 1} 步，为${stage}。`
  return { stage, start, convention, why }
}

export function changShengRow(el: WuXing): { zhi: string; stage: string }[] {
  const start = ZHI.indexOf(CS_START[el])
  return CS_STAGES.map((stage, k) => ({ zhi: ZHI[(start + k) % 12], stage }))
}
