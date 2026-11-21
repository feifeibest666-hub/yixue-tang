import { existsSync } from 'node:fs'
import type { Lesson } from '../src/data/types'
import { ZHOUYI_TEXT } from '../src/data/zhouyiText'

/** 一条可核对的原文。src 用「乾·卦辞」「系辞上」这种篇章名。 */
export interface CorpusEntry { src: string; text: string }

/** 去掉空白和标点，只留字，用来对引文。 */
export function normalizeQuote(s: string): string {
  return s.replace(/[\s\p{P}\p{S}]+/gu, '')
}

/**
 * CORPUS builder。现在装入通行本经文（卦辞、爻辞、大象）。
 * 十翼由另一处补上，二选一：
 * 1. 在 src/data/yizhuan.ts 导出 `CORPUS`（或 `YIZHUAN` / `PASSAGES`）：`{ src, text }[]`，或 `{ [src]: text }`。本文件会在文件出现后自动读入。
 * 2. 直接把条目传给 buildCorpus(extra)，或在 jingwen 之后追加。
 */
export function buildCorpus(extra: CorpusEntry[] = []): CorpusEntry[] {
  return [...jingwenCorpus(), ...extra]
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
