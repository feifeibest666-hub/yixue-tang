import { HEXAGRAMS, TRIGRAMS, type Line } from './bagua'

export interface StudyCard {
  id: string
  deck: 'bagua' | 'gua64'
  prompt: string
  lines?: Line[] // 卡面显示的卦画
  answer: string
  options: string[] // 测验用（含正确答案）
  note?: string
}

const pickDistinct = (pool: string[], answer: string, seed: number, n = 3) => {
  const others = [...new Set(pool.filter((p) => p !== answer))]
  const step = others.length > 3 ? 3 : 1
  const out: string[] = []
  for (let k = 0; out.length < Math.min(n, others.length) && k < others.length * 4; k++) {
    const v = others[(seed + k * step) % others.length]
    if (!out.includes(v)) out.push(v)
  }
  return [answer, ...out]
}

const baguaCards: StudyCard[] = TRIGRAMS.flatMap((t, i) => {
  const names = TRIGRAMS.map((x) => x.name)
  return [
    { id: `bg-${t.name}-name`, deck: 'bagua', prompt: '这是哪一卦？', lines: t.lines, answer: t.name, options: pickDistinct(names, t.name, i + 1), note: t.mnemonic },
    { id: `bg-${t.name}-nature`, deck: 'bagua', prompt: `${t.name}卦的自然象是？`, answer: t.nature, options: pickDistinct(TRIGRAMS.map((x) => x.nature), t.nature, i + 2), note: `性情：${t.trait}` },
    { id: `bg-${t.name}-num`, deck: 'bagua', prompt: `${t.name}卦的先天数是？`, answer: String(t.xiantianNum), options: pickDistinct(TRIGRAMS.map((x) => String(x.xiantianNum)), String(t.xiantianNum), i + 3), note: '乾一兑二离三震四巽五坎六艮七坤八' },
    { id: `bg-${t.name}-wx`, deck: 'bagua', prompt: `${t.name}卦的五行是？`, answer: t.wuxing, options: pickDistinct(['金', '木', '水', '火', '土'], t.wuxing, i + 4) },
    { id: `bg-${t.name}-dir`, deck: 'bagua', prompt: `${t.name}卦的后天方位是？`, answer: t.houtianDir, options: pickDistinct(TRIGRAMS.map((x) => x.houtianDir), t.houtianDir, i + 5) },
    { id: `bg-${t.name}-xdir`, deck: 'bagua', prompt: `${t.name}卦的先天方位是？`, answer: t.xiantianDir, options: pickDistinct(TRIGRAMS.map((x) => x.xiantianDir), t.xiantianDir, i + 6) },
    { id: `bg-${t.name}-family`, deck: 'bagua', prompt: `${t.name}卦代表家中的？`, answer: t.family, options: pickDistinct(TRIGRAMS.map((x) => x.family), t.family, i + 7) },
    { id: `bg-${t.name}-body`, deck: 'bagua', prompt: `${t.name}卦对应身体的？`, answer: t.body, options: pickDistinct(TRIGRAMS.map((x) => x.body), t.body, i + 8) },
    { id: `bg-${t.name}-animal`, deck: 'bagua', prompt: `${t.name}卦对应的动物是？`, answer: t.animal, options: pickDistinct(TRIGRAMS.map((x) => x.animal), t.animal, i + 9) },
  ] as StudyCard[]
})

const gua64Cards: StudyCard[] = HEXAGRAMS.flatMap((h) => {
  const names = HEXAGRAMS.map((x) => x.name)
  const full = HEXAGRAMS.map((x) => x.fullName)
  return [
    { id: `g-${h.n}-name`, deck: 'gua64', prompt: '这是哪一卦？', lines: h.lines, answer: h.name, options: pickDistinct(names, h.name, h.n * 3), note: `${h.fullName}：${h.gist}` },
    { id: `g-${h.n}-full`, deck: 'gua64', prompt: `「${h.name}」卦的全名（上下卦）是？`, answer: h.fullName, options: pickDistinct(full, h.fullName, h.n * 5 + 1), note: `上${h.upper.name}下${h.lower.name}` },
  ] as StudyCard[]
})

export const ALL_CARDS = [...baguaCards, ...gua64Cards]
export const cardById = (id: string) => ALL_CARDS.find((c) => c.id === id)

// 稳定洗牌：同一题每次选项顺序一致
export function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let h = 2166136261
  for (const ch of seedStr) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
