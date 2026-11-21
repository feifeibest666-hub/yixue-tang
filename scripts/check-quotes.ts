import { existsSync } from 'node:fs'
import type { Lesson } from '../src/data/types'
import { SHUOGUA, TUAN, WENYAN, XICI_SHANG, XICI_XIA, XIANG_XIAO, XUGUA, ZAGUA } from '../src/data/yizhuan'
import { ZHOUYI_TEXT } from '../src/data/zhouyiText'

/** 一条可核对的原文。src 用「乾·卦辞」「系辞上」这种篇章名。 */
export interface CorpusEntry { src: string; text: string }

/** 去掉空白和标点，只留字，用来对引文。 */
export function normalizeQuote(s: string): string {
  return s.replace(/[\s\p{P}\p{S}]+/gu, '')
}

const CN = '零一二三四五六七八九'
const cnNum = (n: number) => (n === 10 ? '十' : n < 10 ? CN[n] : '十' + CN[n - 10])

/**
 * CORPUS：通行本经文，加上十翼。
 * 篇章名用「乾·彖」「乾·初九小象」「系辞上·第1章」这种。第N章同时收阿拉伯数字和中文数字。
 */
export function buildCorpus(extra: CorpusEntry[] = []): CorpusEntry[] {
  return [...jingwenCorpus(), ...yizhuanCorpus(), ...extra]
}

function yizhuanCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = []
  ZHOUYI_TEXT.forEach((g, i) => {
    out.push({ src: `${g.name}·彖`, text: TUAN[i] })
    out.push({ src: `${g.name}·小象`, text: XIANG_XIAO[i].join('\n') })
    g.yao.forEach((y, k) => {
      const label = y.split(/[：:]/)[0]?.trim()
      if (label && XIANG_XIAO[i][k]) out.push({ src: `${g.name}·${label}小象`, text: XIANG_XIAO[i][k] })
    })
  })
  out.push({ src: '乾·文言', text: WENYAN.qian.join('\n') })
  out.push({ src: '坤·文言', text: WENYAN.kun.join('\n') })
  out.push({ src: '文言', text: [...WENYAN.qian, ...WENYAN.kun].join('\n') })
  const books: [string, string[][]][] = [
    ['系辞上', XICI_SHANG],
    ['系辞下', XICI_XIA],
    ['说卦', SHUOGUA],
  ]
  for (const [name, chapters] of books) {
    out.push({ src: name, text: chapters.map((c) => c.join('\n')).join('\n') })
    chapters.forEach((c, i) => {
      const text = c.join('\n')
      out.push({ src: `${name}·第${i + 1}章`, text })
      out.push({ src: `${name}·第${cnNum(i + 1)}章`, text })
    })
  }
  out.push({ src: '序卦', text: [...XUGUA.shang, ...XUGUA.xia].join('\n') })
  out.push({ src: '序卦·上', text: XUGUA.shang.join('\n') })
  out.push({ src: '序卦·下', text: XUGUA.xia.join('\n') })
  out.push({ src: '杂卦', text: ZAGUA.join('\n') })
  return out
}

function jingwenCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = []
  for (const g of ZHOUYI_TEXT) {
    out.push({ src: `${g.name}·卦辞`, text: g.guaci })
    out.push({ src: `${g.name}·爻辞`, text: g.yao.join('\n') })
    out.push({ src: `${g.name}·大象`, text: g.xiang })
    for (const y of g.yao) {
      const label = y.split(/[：:]/)[0]?.trim()
      if (label) out.push({ src: `${g.name}·${label}`, text: y })
    }
  }
  return out
}

function asEntries(v: unknown): CorpusEntry[] {
  if (!v) return []
  if (Array.isArray(v)) {
    return v.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const o = item as Record<string, unknown>
      const src = o.src ?? o.source ?? o.id ?? o.name
      const text = o.text ?? o.body ?? o.content
      if (typeof src === 'string' && typeof text === 'string') return [{ src, text }]
      return []
    })
  }
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>).flatMap(([src, text]) =>
      typeof text === 'string' ? [{ src, text }] : [])
  }
  return []
}

function entriesFromModule(mod: Record<string, unknown>): CorpusEntry[] {
  for (const key of ['CORPUS', 'YIZHUAN', 'PASSAGES', 'default']) {
    if (mod[key] == null) continue
    const got = asEntries(mod[key])
    if (got.length) return got
  }
  return []
}

/** 若 src/data/yizhuan.ts 已存在，把它的篇章并进语料；没有就只用经文。 */
export async function corpusWithYizhuan(): Promise<CorpusEntry[]> {
  const url = new URL('../src/data/yizhuan.ts', import.meta.url)
  if (!existsSync(url)) return buildCorpus()
  try {
    const mod = await import(url.href) as Record<string, unknown>
    return buildCorpus(entriesFromModule(mod))
  } catch (e) {
    console.log('yizhuan 未能读入', e instanceof Error ? e.message : e)
    return buildCorpus()
  }
}

function covering(corpus: CorpusEntry[], src: string): CorpusEntry[] {
  const exact = corpus.filter((e) => e.src === src)
  if (exact.length) return exact
  const prefs = corpus.filter((e) => {
    if (!src.startsWith(e.src) || src.length === e.src.length) return false
    const next = src[e.src.length]
    return next === '·' || next === ' ' || next === '　'
  })
  if (!prefs.length) return []
  const longest = Math.max(...prefs.map((e) => e.src.length))
  return prefs.filter((e) => e.src.length === longest)
}

/**
 * 核对 quote 屏。src 落在语料里的，正文（去标点空白后）必须是语料的子串；
 * src 不在语料里的记一笔，最后打印 `unchecked N`，不算失败。
 */
export function checkQuotes(
  lessons: Pick<Lesson, 'day' | 'screens'>[],
  ok: (c: boolean, m: string) => void,
  corpus: CorpusEntry[] = buildCorpus(),
) {
  let unchecked = 0
  for (const l of lessons) {
    for (const s of l.screens) {
      if (s.t !== 'quote') continue
      const hits = covering(corpus, s.src)
      if (!hits.length) { unchecked++; continue }
      const blob = normalizeQuote(hits.map((h) => h.text).join('\n'))
      const q = normalizeQuote(s.text)
      ok(q.length > 0 && blob.includes(q), `引文对不上 ${s.src}（第 ${l.day} 天）：${s.text.slice(0, 24)}`)
    }
  }
  console.log(`unchecked ${unchecked}`)
}
