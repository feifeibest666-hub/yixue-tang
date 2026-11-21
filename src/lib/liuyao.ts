/** 京房八宫、纳甲、六亲六神、朱熹变占。 */
import {
  HEXAGRAMS, hexByLines, hexByTrigrams, ke, sheng, trigramByName, type Hexagram, type Line, type WuXing, YAO_POS,
} from '../data/bagua'
import { YAO_INFO, type YaoNum } from './dayan'
import {
  ganZhiOf, isChong, isHe, jinTui, monthWang, riChongEffect, zhiElement, type GanZhiTime,
} from './ganzhi'

export type LiuQin = '兄弟' | '父母' | '子孙' | '妻财' | '官鬼'
export type Generation = '本宫' | '一世' | '二世' | '三世' | '四世' | '五世' | '游魂' | '归魂'

const PALACE_ORDER = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'] as const
const GEN_NAME: Generation[] = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂']
/** 相对本宫纯卦，哪些爻翻了。下标 0 是初爻。 */
const FLIPS: number[][] = [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4]]
const SHI = [6, 1, 2, 3, 4, 5, 4, 3]

/** 内卦三爻、外卦三爻，自下而上。 */
const NAJIA: Record<string, { inner: [string, string, string]; outer: [string, string, string] }> = {
  乾: { inner: ['甲子', '甲寅', '甲辰'], outer: ['壬午', '壬申', '壬戌'] },
  坤: { inner: ['乙未', '乙巳', '乙卯'], outer: ['癸丑', '癸亥', '癸酉'] },
  震: { inner: ['庚子', '庚寅', '庚辰'], outer: ['庚午', '庚申', '庚戌'] },
  巽: { inner: ['辛丑', '辛亥', '辛酉'], outer: ['辛未', '辛巳', '辛卯'] },
  坎: { inner: ['戊寅', '戊辰', '戊午'], outer: ['戊申', '戊戌', '戊子'] },
  离: { inner: ['己卯', '己丑', '己亥'], outer: ['己酉', '己未', '己巳'] },
  艮: { inner: ['丙辰', '丙午', '丙申'], outer: ['丙戌', '丙子', '丙寅'] },
  兑: { inner: ['丁巳', '丁卯', '丁丑'], outer: ['丁亥', '丁酉', '丁未'] },
}

const SPIRITS = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const
const SPIRIT_AT: Record<string, number> = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 }

export interface NajiaCell { gz: string; stem: string; branch: string; element: WuXing }

export function installNajia(hex: Hexagram): NajiaCell[] {
  const cells = [...NAJIA[hex.lower.name].inner, ...NAJIA[hex.upper.name].outer]
  return cells.map((gz) => ({ gz, stem: gz[0], branch: gz[1], element: zhiElement(gz[1]) }))
}

export function liuQin(palace: WuXing, el: WuXing): LiuQin {
  if (el === palace) return '兄弟'
  if (sheng(el) === palace) return '父母'
  if (sheng(palace) === el) return '子孙'
  if (ke(el) === palace) return '官鬼'
  return '妻财'
}

export function qinWhy(palace: string, palaceWx: WuXing, el: WuXing, qin: LiuQin): string {
  const how = qin === '兄弟' ? `和宫的${palaceWx}相同，同我者为兄弟`
    : qin === '父母' ? `${el}生${palaceWx}，生我者为父母`
    : qin === '子孙' ? `${palaceWx}生${el}，我生者为子孙`
    : qin === '官鬼' ? `${el}克${palaceWx}，克我者为官鬼`
    : `${palaceWx}克${el}，我克者为妻财`
  return `六亲按本宫五行定，不按这一卦上下卦各自的五行。本宫${palace}属${palaceWx}，这一爻属${el}，${how}。`
}

export interface PalaceSlot {
  palace: string
  element: WuXing
  generation: Generation
  /** 宫里的第几卦，0 是本宫 */
  index: number
  shi: number
  ying: number
  hex: Hexagram
  why: string
}

export interface PalaceRow { palace: string; element: WuXing; slots: PalaceSlot[] }

function buildChart(): PalaceRow[] {
  return PALACE_ORDER.map((name) => {
    const tri = trigramByName(name)
    const pure = [...tri.lines, ...tri.lines] as Line[]
    const slots = FLIPS.map((flips, index) => {
      const lines = pure.slice() as Line[]
      for (const i of flips) lines[i] = (lines[i] === 1 ? 0 : 1)
      const hex = hexByLines(lines)
      const shi = SHI[index]
      const ying = shi > 3 ? shi - 3 : shi + 3
      const generation = GEN_NAME[index]
      const why = `京房八宫从八纯卦往外变。${name}宫属${tri.wuxing}。本宫世在上爻；然后变初爻为一世，变到第二爻为二世，一直变到第五爻为五世；五世再把第四爻变回去是游魂，世回到四爻；游魂再把下面三爻变回本宫，是归魂，世在三爻。应爻比世爻隔开三位。这一卦是${name}宫${generation}，世在${YAO_POS[shi - 1]}爻，应在${YAO_POS[ying - 1]}爻。`
      return { palace: name, element: tri.wuxing, generation, index, shi, ying, hex, why }
    })
    return { palace: name, element: tri.wuxing, slots }
  })
}

const CHART = buildChart()
const BY_LINES = new Map<string, PalaceSlot>(CHART.flatMap((row) => row.slots.map((s) => [s.hex.lines.join(''), s] as const)))

export function palaceChart(): PalaceRow[] {
  return CHART
}

export function palaceOf(hex: Hexagram): PalaceSlot {
  const slot = BY_LINES.get(hex.lines.join(''))
  if (!slot) throw new Error(`不在八宫里：${hex.name}`)
  return slot
}

export function numsFromLines(lines: Line[], movingPos: number[]): YaoNum[] {
  const moving = new Set(movingPos)
  return lines.map((line, i) => (line === 1 ? (moving.has(i + 1) ? 9 : 7) : (moving.has(i + 1) ? 6 : 8)))
}

export interface BianText { role: '主' | '辅' | '贞' | '悔' | '用' | '卦辞'; from: '本卦' | '之卦'; text: string }
export interface BianReading {
  ben: Hexagram
  zhi: Hexagram
  moving: number[]
  count: number
  rule: string
  why: string
  texts: BianText[]
}

const BIAN_RULE = [
  '六爻都不动，看本卦的卦辞。',
  '只有一个爻动，看本卦这个动爻的爻辞。',
  '两个爻动，看本卦这两条爻辞，上面那一爻为主。',
  '三个爻动，本卦卦辞和之卦卦辞一起看，本卦为贞、之卦为悔。',
  '四个爻动，看之卦里两个没有动的爻，下面那一爻为主。',
  '五个爻动，看之卦里那一个没有动的爻。',
  '六爻全动：乾看用九，坤看用六，其他卦看之卦的卦辞。',
]

/** 朱熹《易学启蒙·考变占》。nums 自下而上，每个是 6、7、8、9。 */
export function readBianGua(nums: number[]): BianReading {
  if (nums.length !== 6 || nums.some((n) => !isYao(n))) throw new Error('变占要六个数，每个是 6、7、8 或 9')
  const yao = nums as YaoNum[]
  const lines = yao.map((n) => (YAO_INFO[n].yang ? 1 : 0)) as Line[]
  const moving = yao.map((n, i) => (YAO_INFO[n].moving ? i + 1 : 0)).filter((n) => n > 0)
  const ben = hexByLines(lines)
  const zLines = lines.map((line, i) => (YAO_INFO[nums[i] as YaoNum].moving ? (line === 1 ? 0 : 1) : line)) as Line[]
  const zhi = hexByLines(zLines)
  const count = moving.length
  const rule = BIAN_RULE[count]
  const still = [1, 2, 3, 4, 5, 6].filter((p) => !moving.includes(p))
  let texts: BianText[] = []
  let why = ''
  if (count === 0) {
    texts = [{ role: '卦辞', from: '本卦', text: ben.guaci }]
    why = '没有爻在变，朱熹这条看本卦卦辞。'
  } else if (count === 1) {
    texts = [{ role: '主', from: '本卦', text: ben.yao[moving[0] - 1] }]
    why = `只有${YAO_POS[moving[0] - 1]}爻动，看本卦这一爻的爻辞。`
  } else if (count === 2) {
    const [lo, hi] = [...moving].sort((a, b) => a - b)
    texts = [
      { role: '主', from: '本卦', text: ben.yao[hi - 1] },
      { role: '辅', from: '本卦', text: ben.yao[lo - 1] },
    ]
    why = `${YAO_POS[lo - 1]}爻和${YAO_POS[hi - 1]}爻都动。两条都看，上面的${YAO_POS[hi - 1]}爻为主，下面的为辅。`
  } else if (count === 3) {
    texts = [
      { role: '贞', from: '本卦', text: ben.guaci },
      { role: '悔', from: '之卦', text: zhi.guaci },
    ]
    why = '动了三爻。朱熹叫本卦为贞、之卦为悔，两条卦辞一起看。'
  } else if (count === 4) {
    const [lo, hi] = still
    texts = [
      { role: '主', from: '之卦', text: zhi.yao[lo - 1] },
      { role: '辅', from: '之卦', text: zhi.yao[hi - 1] },
    ]
    why = `四个爻在动，反过去只剩${YAO_POS[lo - 1]}、${YAO_POS[hi - 1]}两条不变。看之卦这两条爻辞，下面的${YAO_POS[lo - 1]}爻为主。`
  } else if (count === 5) {
    texts = [{ role: '主', from: '之卦', text: zhi.yao[still[0] - 1] }]
    why = `五爻都变，之卦里只剩${YAO_POS[still[0] - 1]}爻没变，就看之卦这一爻。`
  } else if (ben.name === '乾') {
    texts = [{ role: '用', from: '本卦', text: ben.yao[6] }]
    why = '六爻全动，本卦是乾，朱熹这条用乾的用九，不用坤的卦辞。'
  } else if (ben.name === '坤') {
    texts = [{ role: '用', from: '本卦', text: ben.yao[6] }]
    why = '六爻全动，本卦是坤，朱熹这条用坤的用六。'
  } else {
    texts = [{ role: '卦辞', from: '之卦', text: zhi.guaci }]
    why = `六爻全动，本卦不是乾也不是坤，看之卦${zhi.name}的卦辞。`
  }
  return { ben, zhi, moving, count, rule, why, texts }
}

function isYao(n: number): n is YaoNum {
  return n === 6 || n === 7 || n === 8 || n === 9
}

export interface LineMark { label: string; why: string }
export interface FuShen { gz: string; element: WuXing; qin: LiuQin; why: string }
export interface ChangedYao {
  gz: string
  stem: string
  branch: string
  element: WuXing
  qin: LiuQin
  huiTou: '回头生' | '回头克' | null
  jinTui: '化进' | '化退' | null
  yinFan: '反吟' | '伏吟' | null
  why: string
}
export interface PlateLine {
  pos: number
  num: YaoNum
  yinYang: Line
  moving: boolean
  gz: string
  stem: string
  branch: string
  element: WuXing
  qin: LiuQin
  spirit: string
  shi: boolean
  ying: boolean
  fu: FuShen | null
  fuNote: string
  changed: ChangedYao | null
  changeNote: string
  flags: LineMark[]
  whyNajia: string
  whyQin: string
  whySpirit: string
  whyPos: string
}

export interface FlagWhy { yes: boolean; why: string }
export interface Plate {
  nums: YaoNum[]
  lines: PlateLine[]
  ben: Hexagram
  zhi: Hexagram
  palace: PalaceSlot
  chongGua: FlagWhy
  heGua: FlagWhy
  fanYin: FlagWhy
  fuYin: FlagWhy
  when: GanZhiTime
}

function pairWhy(branches: string[], kind: '冲' | '合'): FlagWhy {
  const names = ['初与四', '二与五', '三与上']
  const idx = [[0, 3], [1, 4], [2, 5]] as const
  const test = kind === '冲' ? isChong : isHe
  const bits = idx.map(([a, b], i) => `${names[i]}是${branches[a]}${branches[b]}${test(branches[a], branches[b]) ? kind : '不是'}`)
  const yes = idx.every(([a, b]) => test(branches[a], branches[b]))
  const why = `六${kind}卦看三对：初四、二五、三上，三对地支都相${kind}才算。这一卦${bits.join('；')}。${yes ? `三对都相${kind}，是六${kind}卦。` : `并不是三对都相${kind}。`}`
  return { yes, why }
}

export function plateFromNumbers(nums: number[], date: Date): Plate {
  if (nums.length !== 6 || nums.some((n) => !isYao(n))) throw new Error('排盘要六个数，每个是 6、7、8 或 9')
  const yao = nums as YaoNum[]
  const lines = yao.map((n) => (YAO_INFO[n].yang ? 1 : 0)) as Line[]
  const ben = hexByLines(lines)
  const zLines = lines.map((line, i) => (YAO_INFO[yao[i]].moving ? (line === 1 ? 0 : 1) : line)) as Line[]
  const zhi = hexByLines(zLines)
  const palace = palaceOf(ben)
  const pure = palaceChart().find((row) => row.palace === palace.palace)!.slots[0].hex
  const benJia = installNajia(ben)
  const zhiJia = installNajia(zhi)
  const pureJia = installNajia(pure)
  const qinOf = (el: WuXing) => liuQin(palace.element, el)
  const present = new Set(benJia.map((cell) => qinOf(cell.element)))
  const when = ganZhiOf(date)
  const spirit0 = SPIRIT_AT[when.dayGan]
  const benBranches = benJia.map((cell) => cell.branch)
  const zhiBranches = zhiJia.map((cell) => cell.branch)
  const moved = yao.some((n) => YAO_INFO[n].moving)

  const plateLines: PlateLine[] = yao.map((num, i) => {
    const cell = benJia[i]
    const qin = qinOf(cell.element)
    const moving = YAO_INFO[num].moving
    const pureCell = pureJia[i]
    const pureQin = qinOf(pureCell.element)
    const fu: FuShen | null = present.has(pureQin) ? null : {
      gz: pureCell.gz,
      element: pureCell.element,
      qin: pureQin,
      why: `本卦六条爻里没有「${pureQin}」。本宫${palace.palace}纯卦同一位置是${pureCell.gz}${pureCell.element}，六亲是${pureQin}。缺的六亲从本宫同位伏在这条爻下面。`,
    }
    const fuNote = fu ? fu.why : `本宫${palace.palace}纯卦这一爻是${pureCell.gz}${pureQin}。本卦里已经有「${pureQin}」，所以这里不伏神。`
    const info = YAO_INFO[num]
    const wang = monthWang(when.monthZhi, cell.element)
    const flags: LineMark[] = []
    if (when.kong.includes(cell.branch)) {
      flags.push({ label: '旬空', why: `${when.why.kong}本爻地支是${cell.branch}，正在空亡里。` })
    }
    if (isChong(cell.branch, when.monthZhi)) {
      flags.push({ label: '月破', why: `月建是${when.monthZhi}，和本爻${cell.branch}相冲。月令来冲这一爻，叫月破。` })
    }
    if (isChong(cell.branch, when.dayZhi)) {
      const effect = riChongEffect(moving, wang.state)
      flags.push({
        label: effect,
        why: effect === '暗动'
          ? `日辰${when.day}的地支${when.dayZhi}冲本爻${cell.branch}。这一爻是${info.name}，本身不动；${wang.why}又静又旺，再被日辰冲，叫暗动。有的书把「相」也算有气，这里只把「旺」算进去。`
          : `日辰${when.dayZhi}冲本爻${cell.branch}。${moving ? `这一爻是${info.name}，已经在动` : `${wang.why}它是静爻，但不是旺`}，所以不算暗动，记作日破。`,
      })
    }
    let changed: ChangedYao | null = null
    if (moving) {
      const next = zhiJia[i]
      const nextQin = qinOf(next.element)
      const huiTou = sheng(next.element) === cell.element ? '回头生' as const
        : ke(next.element) === cell.element ? '回头克' as const : null
      const step = jinTui(cell.branch, next.branch)
      const yinFan = next.branch === cell.branch ? '伏吟' as const : isChong(cell.branch, next.branch) ? '反吟' as const : null
      const bits = [
        `这一爻从${info.name}变成${lines[i] === 1 ? '阴' : '阳'}。变爻的干支取之卦${zhi.name}同位的纳甲，是${next.gz}${next.element}；六亲仍按原来的${palace.palace}宫${palace.element}来定，所以是${nextQin}，不改用之卦自己的宫。`,
      ]
      if (huiTou === '回头生') bits.push(`变出的${next.element}生本爻的${cell.element}，叫回头生。`)
      else if (huiTou === '回头克') bits.push(`变出的${next.element}克本爻的${cell.element}，叫回头克。`)
      else if (sheng(cell.element) === next.element) bits.push(`本爻的${cell.element}生变爻的${next.element}，是泄出去，不叫回头生。`)
      else if (ke(cell.element) === next.element) bits.push(`本爻的${cell.element}克变爻的${next.element}，不叫回头克。回头生克只看变爻反过来生克本爻。`)
      else bits.push(`变爻和本爻同属${cell.element}，没有生克。`)
      if (step === '化进') bits.push(`${cell.branch}变成${next.branch}，顺着亥→子、寅→卯、巳→午、申→酉，或丑→辰→未→戌→丑，叫化进。`)
      else if (step === '化退') bits.push(`${cell.branch}变成${next.branch}，是上面那条进神的反方向，叫化退。`)
      if (yinFan === '伏吟') bits.push('变出的地支和本爻一样，这一爻是伏吟。')
      if (yinFan === '反吟') bits.push('变出的地支冲本爻，这一爻是反吟。')
      changed = {
        gz: next.gz, stem: next.stem, branch: next.branch, element: next.element, qin: nextQin,
        huiTou, jinTui: step, yinFan, why: bits.join(''),
      }
    }
    const changeNote = changed?.why ?? `这一爻得 ${num}，是${info.name}，不动，没有变爻。`
    const where = i < 3 ? '内卦' : '外卦'
    const trigram = i < 3 ? ben.lower.name : ben.upper.name
    return {
      pos: i + 1,
      num, yinYang: lines[i], moving,
      gz: cell.gz, stem: cell.stem, branch: cell.branch, element: cell.element, qin,
      spirit: SPIRITS[(spirit0 + i) % 6],
      shi: palace.shi === i + 1,
      ying: palace.ying === i + 1,
      fu, fuNote, changed, changeNote, flags,
      whyNajia: `${where}是${trigram}。${trigram}在${i < 3 ? '内' : '外'}卦的纳甲，自下而上是${(i < 3 ? NAJIA[trigram].inner : NAJIA[trigram].outer).join('、')}。${YAO_POS[i]}爻因此是${cell.gz}，地支${cell.branch}属${cell.element}。`,
      whyQin: qinWhy(palace.palace, palace.element, cell.element, qin),
      whySpirit: `日干${when.dayGan}起${SPIRITS[spirit0]}。六神的次序是青龙、朱雀、勾陈、螣蛇、白虎、玄武，从初爻往上排。${YAO_POS[i]}爻排到${SPIRITS[(spirit0 + i) % 6]}。甲乙起青龙，丙丁起朱雀，戊起勾陈，己起螣蛇，庚辛起白虎，壬癸起玄武。`,
      whyPos: palace.shi === i + 1
        ? `世爻在这一爻。${palace.why}`
        : palace.ying === i + 1
          ? `应爻在这一爻，和世爻隔三位。${palace.why}`
          : `${YAO_POS[i]}爻既不是世也不是应。${palace.why}`,
    }
  })

  const same = benBranches.every((b, i) => b === zhiBranches[i])
  const clash = benBranches.every((b, i) => isChong(b, zhiBranches[i]))
  const pairText = benBranches.map((b, i) => `${b}/${zhiBranches[i]}`).join('、')
  return {
    nums: yao,
    lines: plateLines,
    ben, zhi, palace, when,
    chongGua: pairWhy(benBranches, '冲'),
    heGua: pairWhy(benBranches, '合'),
    fuYin: {
      yes: moved && same,
      why: !moved
        ? '没有动爻，之卦就是本卦，不叫伏吟。伏吟要卦变了、六爻地支却一个没变。'
        : same
          ? `之卦和本卦六爻地支都是${benBranches.join('')}。卦变了地支没变，是伏吟。乾和震、以及它们拼出来的卦，纳支相同，会走出这种结果。`
          : `本卦地支${benBranches.join('')}，之卦${zhiBranches.join('')}，并不完全相同。`,
    },
    fanYin: {
      yes: moved && clash,
      why: !moved
        ? '没有动爻，谈不上反吟。反吟是之卦六爻地支逐爻冲本卦。'
        : clash
          ? `逐爻对照${pairText}，六对都相冲，是反吟。纳甲里能整卦相冲的，是坤宫和巽宫那一组地支。`
          : `逐爻对照${pairText}，并不是六对都相冲。`,
    },
  }
}

const BOSH_UPPER = ['乾', '艮', '坎', '震', '坤', '兑', '离', '巽']
const BOSH_LOWER = ['乾', '坤', '艮', '兑', '坎', '离', '震', '巽']

/** 帛书卦序：上卦按乾艮坎震坤兑离巽分组，每组先出重卦，再按下卦乾坤艮兑坎离震巽。 */
export function boshuOrder(): Hexagram[] {
  const out: Hexagram[] = []
  for (const up of BOSH_UPPER) {
    const lowers = [up, ...BOSH_LOWER.filter((name) => name !== up)]
    for (const lo of lowers) out.push(hexByTrigrams(trigramByName(lo), trigramByName(up)))
  }
  return out
}

/**
 * 先天序：自上而下读爻，上爻为最低位，阴爻记 1、阳爻记 0。
 * 乾是 0，夬是 1，坤是 63。圆图左半从乾走到复，右半从姤走到坤。
 */
export function xiantianIndex(lines: Line[]): number {
  let n = 0
  for (let bit = 0; bit < 6; bit++) if (lines[5 - bit] === 0) n |= 1 << bit
  return n
}

export function xiantianOrder(): Hexagram[] {
  const out: Hexagram[] = new Array(64)
  for (const hex of HEXAGRAMS) out[xiantianIndex(hex.lines as Line[])] = hex
  return out
}
