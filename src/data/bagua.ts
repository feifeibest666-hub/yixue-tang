import { ZHOUYI_TEXT } from './zhouyiText'
import { BAIHUA } from './baihua'

export type WuXing = '金' | '木' | '水' | '火' | '土'
export type Line = 0 | 1 // 0 = 阴爻（断线）  1 = 阳爻（实线）

export interface Trigram {
  name: string
  symbol: string
  lines: [Line, Line, Line] // 由下往上
  nature: string // 自然象
  xiantianNum: number // 先天数
  wuxing: WuXing
  xiantianDir: string
  houtianDir: string
  family: string
  body: string
  animal: string
  trait: string
  more: string
  mnemonic: string
}

export const TRIGRAMS: Trigram[] = [
  { name: '乾', symbol: '☰', lines: [1, 1, 1], nature: '天', xiantianNum: 1, wuxing: '金', xiantianDir: '南', houtianDir: '西北', family: '父', body: '头', animal: '马', trait: '健', more: '君、玉、金、圆、寒、冰、大赤', mnemonic: '乾三连' },
  { name: '兑', symbol: '☱', lines: [1, 1, 0], nature: '泽', xiantianNum: 2, wuxing: '金', xiantianDir: '东南', houtianDir: '西', family: '少女', body: '口', animal: '羊', trait: '悦', more: '巫、口舌、毁折、妾、刚卤之地', mnemonic: '兑上缺' },
  { name: '离', symbol: '☲', lines: [1, 0, 1], nature: '火', xiantianNum: 3, wuxing: '火', xiantianDir: '东', houtianDir: '南', family: '中女', body: '目', animal: '雉', trait: '丽（附着、光明）', more: '日、电、甲胄、戈兵、大腹', mnemonic: '离中虚' },
  { name: '震', symbol: '☳', lines: [1, 0, 0], nature: '雷', xiantianNum: 4, wuxing: '木', xiantianDir: '东北', houtianDir: '东', family: '长男', body: '足', animal: '龙', trait: '动', more: '大涂（大路）、决躁、苍筤竹、萑苇', mnemonic: '震仰盂' },
  { name: '巽', symbol: '☴', lines: [0, 1, 1], nature: '风', xiantianNum: 5, wuxing: '木', xiantianDir: '西南', houtianDir: '东南', family: '长女', body: '股（大腿）', animal: '鸡', trait: '入', more: '木、绳直、工、白、长、高、进退', mnemonic: '巽下断' },
  { name: '坎', symbol: '☵', lines: [0, 1, 0], nature: '水', xiantianNum: 6, wuxing: '水', xiantianDir: '西', houtianDir: '北', family: '中男', body: '耳', animal: '豕（猪）', trait: '陷（险）', more: '沟渎、隐伏、弓轮、月、盗', mnemonic: '坎中满' },
  { name: '艮', symbol: '☶', lines: [0, 0, 1], nature: '山', xiantianNum: 7, wuxing: '土', xiantianDir: '西北', houtianDir: '东北', family: '少男', body: '手', animal: '狗', trait: '止', more: '径路、小石、门阙、果蓏', mnemonic: '艮覆碗' },
  { name: '坤', symbol: '☷', lines: [0, 0, 0], nature: '地', xiantianNum: 8, wuxing: '土', xiantianDir: '北', houtianDir: '西南', family: '母', body: '腹', animal: '牛', trait: '顺', more: '布、釜、吝啬、均、众、柄、黑', mnemonic: '坤六断' },
]

export const trigramByName = (n: string) => TRIGRAMS.find((t) => t.name === n)!
export const trigramByNum = (n: number) => TRIGRAMS.find((t) => t.xiantianNum === n)!
export const trigramByLines = (l: Line[]) => TRIGRAMS.find((t) => t.lines.every((v, i) => v === l[i]))!

export interface Hexagram {
  n: number
  name: string
  fullName: string // 如“天地否”
  lower: Trigram
  upper: Trigram
  lines: Line[] // 6 爻，由下往上
  guaci: string
  yao: string[] // 含爻题，如“初九：潜龙勿用。”；乾坤含第 7 条用九/用六
  xiang: string
  gist: string
  gcBai: string
  yaoBai: string[]
}

export const HEXAGRAMS: Hexagram[] = ZHOUYI_TEXT.map((t, i) => {
  const lower = trigramByName(t.lower)
  const upper = trigramByName(t.upper)
  const b = BAIHUA[i]
  const fullName = lower === upper ? `${upper.name}为${upper.nature}` : `${upper.nature}${lower.nature}${t.name}`
  return {
    n: t.n,
    name: t.name,
    fullName,
    lower,
    upper,
    lines: [...lower.lines, ...upper.lines],
    guaci: t.guaci,
    yao: t.yao,
    xiang: t.xiang,
    gist: b.gist,
    gcBai: b.gc,
    yaoBai: b.yong ? [...b.yao, b.yong] : b.yao,
  }
})

export const hexByLines = (l: Line[]) =>
  HEXAGRAMS.find((h) => h.lines.every((v, i) => v === l[i]))!
export const hexByTrigrams = (lower: Trigram, upper: Trigram) =>
  HEXAGRAMS.find((h) => h.lower === lower && h.upper === upper)!

export const YAO_POS = ['初', '二', '三', '四', '五', '上']
export const yaoTitle = (pos: number, line: Line) => {
  const nv = line ? '九' : '六'
  if (pos === 0) return '初' + nv
  if (pos === 5) return '上' + nv
  return nv + YAO_POS[pos]
}

// 五行
const SHENG: Record<WuXing, WuXing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<WuXing, WuXing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
export const sheng = (a: WuXing) => SHENG[a]
export const ke = (a: WuXing) => KE[a]

export type Relation = '比和' | '用生体' | '体生用' | '体克用' | '用克体'
export function relationOf(ti: WuXing, other: WuXing): Relation {
  if (ti === other) return '比和'
  if (SHENG[other] === ti) return '用生体'
  if (SHENG[ti] === other) return '体生用'
  if (KE[ti] === other) return '体克用'
  return '用克体'
}
export const RELATION_MEANING: Record<Relation, { level: '吉' | '平' | '凶'; text: string }> = {
  用生体: { level: '吉', text: '用卦生体卦：有外力相助、有进益之喜，主吉。' },
  比和: { level: '吉', text: '体用五行相同（比和）：彼此和合、百事顺遂，主吉。' },
  体克用: { level: '吉', text: '体卦克用卦：我能制住事情，虽需费力，终可成，主吉（略费周折）。' },
  体生用: { level: '平', text: '体卦生用卦：我去生扶对方，主耗损、付出、破财，偏不利。' },
  用克体: { level: '凶', text: '用卦克体卦：事情来克制我，主阻碍、不顺，为凶。' },
}

// 旺相休囚死：当令五行旺，旺所生为相，生旺者为休，克旺者为囚，旺所克为死
export function wangShuai(season: WuXing, x: WuXing): '旺' | '相' | '休' | '囚' | '死' {
  if (x === season) return '旺'
  if (SHENG[season] === x) return '相'
  if (SHENG[x] === season) return '休'
  if (KE[x] === season) return '囚'
  return '死'
}

export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
