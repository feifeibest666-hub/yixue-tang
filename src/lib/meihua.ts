import { Solar } from 'lunar-javascript'
import {
  DIZHI, HEXAGRAMS, RELATION_MEANING, type Hexagram, type Line, type Relation, type Trigram, type WuXing,
  hexByLines, relationOf, trigramByLines, trigramByNum, wangShuai, yaoTitle,
} from '../data/bagua'

export const mod8 = (n: number) => (n % 8 === 0 ? 8 : n % 8)
export const mod6 = (n: number) => (n % 6 === 0 ? 6 : n % 6)

export interface MeihuaResult {
  method: 'time' | 'number'
  inputLabel: string
  steps: string[]
  ben: Hexagram
  hu: Hexagram
  bian: Hexagram
  moving: number // 1..6，由下往上
  ti: Trigram
  yong: Trigram
  tiPos: '上卦' | '下卦'
  relation: Relation
  huRelations: { tri: Trigram; rel: Relation }[]
  bianRelation: Relation
  season?: { zhi: string; wx: WuXing; tiState: string }
  summary: string[]
}

const seasonOfMonthZhi = (zhi: string): WuXing => {
  if ('寅卯'.includes(zhi)) return '木'
  if ('巳午'.includes(zhi)) return '火'
  if ('申酉'.includes(zhi)) return '金'
  if ('亥子'.includes(zhi)) return '水'
  return '土'
}

function analyze(
  upperNum: number, lowerNum: number, moving: number, method: MeihuaResult['method'],
  inputLabel: string, steps: string[], monthZhi?: string,
): MeihuaResult {
  const upper = trigramByNum(upperNum)
  const lower = trigramByNum(lowerNum)
  const benLines = [...lower.lines, ...upper.lines] as Line[]
  const ben = hexByLines(benLines)
  steps.push(`本卦：上${upper.name}（${upper.nature}）下${lower.name}（${lower.nature}），合成第 ${ben.n} 卦「${ben.fullName}」。`)

  const huLower = trigramByLines(benLines.slice(1, 4))
  const huUpper = trigramByLines(benLines.slice(2, 5))
  const hu = hexByLines([...huLower.lines, ...huUpper.lines])
  steps.push(`互卦：取本卦第 2、3、4 爻作下卦 → ${huLower.name}；取第 3、4、5 爻作上卦 → ${huUpper.name}；得「${hu.fullName}」。`)

  const bianLines = benLines.slice() as Line[]
  bianLines[moving - 1] = (1 - bianLines[moving - 1]) as Line
  const bian = hexByLines(bianLines)
  const oldTitle = yaoTitle(moving - 1, benLines[moving - 1])
  steps.push(`变卦：动爻是第 ${moving} 爻（${oldTitle}），${benLines[moving - 1] ? '阳变阴' : '阴变阳'}，得「${bian.fullName}」。`)

  const movingInLower = moving <= 3
  const ti = movingInLower ? upper : lower
  const yong = movingInLower ? lower : upper
  steps.push(`体用：动爻在${movingInLower ? '下卦' : '上卦'}，所以${movingInLower ? '下' : '上'}卦${yong.name}为「用」（代表事情），不动的${movingInLower ? '上' : '下'}卦${ti.name}为「体」（代表自己）。`)

  const relation = relationOf(ti.wuxing, yong.wuxing)
  steps.push(`体用生克：体${ti.name}属${ti.wuxing}，用${yong.name}属${yong.wuxing} → ${relation}。${RELATION_MEANING[relation].text}`)

  const huRelations = [huLower, huUpper].map((tri) => ({ tri, rel: relationOf(ti.wuxing, tri.wuxing) }))
  steps.push(`互卦看过程：${huRelations.map((h) => `${h.tri.name}${h.tri.wuxing}对体为${h.rel}`).join('；')}。`)

  const bianTri = movingInLower ? trigramByLines(bianLines.slice(0, 3)) : trigramByLines(bianLines.slice(3, 6))
  const bianRelation = relationOf(ti.wuxing, bianTri.wuxing)
  steps.push(`变卦看结果：用卦变为${bianTri.name}（${bianTri.wuxing}），对体为${bianRelation}。`)

  let season: MeihuaResult['season']
  if (monthZhi) {
    const wx = seasonOfMonthZhi(monthZhi)
    const st = wangShuai(wx, ti.wuxing)
    season = { zhi: monthZhi, wx, tiState: st }
    steps.push(`卦气：起卦在${monthZhi}月，${wx}当令；体卦${ti.wuxing}处于「${st}」。旺、相为有力，休、囚、死为力弱。`)
  }

  const summary = [
    `主体关系：${relation}（${RELATION_MEANING[relation].level}）`,
    `过程（互卦）：${huRelations.map((h) => h.rel).join('、')}`,
    `结果（变卦）：${bianRelation}（${RELATION_MEANING[bianRelation].level}）`,
  ]
  return { method, inputLabel, steps, ben, hu, bian, moving, ti, yong, tiPos: movingInLower ? '上卦' : '下卦', relation, huRelations, bianRelation, season, summary }
}

export interface TimeInput { date: Date; lateZiNextDay: boolean }

export function castByTime({ date, lateZiNextDay }: TimeInput): MeihuaResult {
  let d = date
  const hour = d.getHours()
  const steps: string[] = []
  if (lateZiNextDay && hour === 23) {
    d = new Date(d.getTime() + 60 * 60 * 1000)
    steps.push('23 点已入子时，按“晚子时算次日”的习惯，日期按第二天计。')
  }
  const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0)
  const lunar = solar.getLunar()
  const yearZhi: string = lunar.getYearZhi()
  const yearNum = DIZHI.indexOf(yearZhi) + 1
  const month = Math.abs(lunar.getMonth())
  const day = lunar.getDay()
  const timeZhi: string = lunar.getTimeZhi()
  const timeNum = DIZHI.indexOf(timeZhi) + 1

  steps.unshift(
    `公历 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} → 农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}，${timeZhi}时。`,
  )
  steps.push(`取数：年支${yearZhi}=${yearNum}（子1丑2…亥12），农历月=${month}${lunar.getMonth() < 0 ? '（闰月按本月数）' : ''}，农历日=${day}，时支${timeZhi}=${timeNum}。`)
  const s1 = yearNum + month + day
  const s2 = s1 + timeNum
  steps.push(`上卦：年+月+日 = ${yearNum}+${month}+${day} = ${s1}，除以 8 余 ${s1 % 8}${s1 % 8 === 0 ? '（整除作 8）' : ''} → 先天数 ${mod8(s1)} = ${trigramByNum(mod8(s1)).name}。`)
  steps.push(`下卦：年+月+日+时 = ${s1}+${timeNum} = ${s2}，除以 8 余 ${s2 % 8}${s2 % 8 === 0 ? '（整除作 8）' : ''} → 先天数 ${mod8(s2)} = ${trigramByNum(mod8(s2)).name}。`)
  steps.push(`动爻：${s2} 除以 6 余 ${s2 % 6}${s2 % 6 === 0 ? '（整除作 6）' : ''} → 第 ${mod6(s2)} 爻动（从下往上数）。`)
  const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}（农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${timeZhi}时）`
  return analyze(mod8(s1), mod8(s2), mod6(s2), 'time', label, steps, lunar.getMonthZhi())
}

export function castByNumber(a: number, b: number, addHour: boolean, now = new Date()): MeihuaResult {
  const steps: string[] = []
  const lunar = Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), 0).getLunar()
  const timeZhi: string = lunar.getTimeZhi()
  const timeNum = DIZHI.indexOf(timeZhi) + 1
  steps.push(`取两个数：前数 ${a}，后数 ${b}。`)
  steps.push(`上卦：前数 ${a} 除以 8 余 ${a % 8}${a % 8 === 0 ? '（整除作 8）' : ''} → 先天数 ${mod8(a)} = ${trigramByNum(mod8(a)).name}。`)
  steps.push(`下卦：后数 ${b} 除以 8 余 ${b % 8}${b % 8 === 0 ? '（整除作 8）' : ''} → 先天数 ${mod8(b)} = ${trigramByNum(mod8(b)).name}。`)
  const total = a + b + (addHour ? timeNum : 0)
  steps.push(
    addHour
      ? `动爻：前数+后数+时支数 = ${a}+${b}+${timeNum}（${timeZhi}时）= ${total}，除以 6 余 ${total % 6}${total % 6 === 0 ? '（整除作 6）' : ''} → 第 ${mod6(total)} 爻动。`
      : `动爻：前数+后数 = ${a}+${b} = ${total}，除以 6 余 ${total % 6}${total % 6 === 0 ? '（整除作 6）' : ''} → 第 ${mod6(total)} 爻动。`,
  )
  return analyze(mod8(a), mod8(b), mod6(total), 'number', `数字 ${a}、${b}${addHour ? `（加${timeZhi}时）` : ''}`, steps, lunar.getMonthZhi())
}

export { HEXAGRAMS }
