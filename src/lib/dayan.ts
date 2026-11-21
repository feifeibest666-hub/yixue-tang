/** 大衍筮法与金钱卦。概率用余数穷举，模拟用正中附近的分堆。 */

export type YaoNum = 6 | 7 | 8 | 9
export type CoinMode = 'back3' | 'char3'

export const YAO_INFO: Record<YaoNum, { name: '老阴' | '少阳' | '少阴' | '老阳'; symbol: '交' | '单' | '拆' | '重'; moving: boolean; yang: boolean }> = {
  6: { name: '老阴', symbol: '交', moving: true, yang: false },
  7: { name: '少阳', symbol: '单', moving: false, yang: true },
  8: { name: '少阴', symbol: '拆', moving: false, yang: false },
  9: { name: '老阳', symbol: '重', moving: true, yang: true },
}

export function isYaoNum(n: number): n is YaoNum {
  return n === 6 || n === 7 || n === 8 || n === 9
}

/** 揲四：余 0 记作 4，所以余数只有 1、2、3、4。 */
export function rem4(n: number): 1 | 2 | 3 | 4 {
  const r = n % 4
  return (r === 0 ? 4 : r) as 1 | 2 | 3 | 4
}

export interface ChangeRec {
  /** 这一爻里的第几变，1–3 */
  change: 1 | 2 | 3
  /** 六爻里的第几爻，从下往上 1–6 */
  yao: number
  before: number
  left: number
  right: number
  leftRem: 1 | 2 | 3 | 4
  rightRem: 1 | 2 | 3 | 4
  /** 揲完后仍留在左边的「四个一组」有几组 */
  leftKept: number
  rightKept: number
  guiqi: number
  after: number
  why: string
}

export interface YaoRec {
  yao: number
  changes: ChangeRec[]
  final: number
  value: YaoNum
  why: string
}

export interface HexCast {
  yaos: YaoRec[]
  nums: YaoNum[]
}

function splitLeft(total: number, rng: () => number): number {
  let u = rng()
  const v = rng()
  if (u < 1e-12) u = 1e-12
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  let left = Math.round(total / 2 + z * (total / 7))
  if (left < 1) left = 1
  if (left > total - 2) left = total - 2
  return left
}

function oneChange(before: number, yao: number, change: 1 | 2 | 3, rng: () => number): ChangeRec {
  const left = splitLeft(before, rng)
  const right = before - left
  const rightBody = right - 1
  const leftRem = rem4(left)
  const rightRem = rem4(rightBody)
  const guiqi = 1 + leftRem + rightRem
  const after = before - guiqi
  const leftKept = (left - leftRem) / 4
  const rightKept = (rightBody - rightRem) / 4
  const why = `第 ${yao} 爻第 ${change} 变：手上 ${before} 策，从正中附近分成左 ${left}、右 ${right}。从右边挂出 1 策，右边还剩 ${rightBody}。左边四个一数，余 ${leftRem}（正好除尽就记 4，不记 0）；右边同样余 ${rightRem}。归奇是挂的 1 加上两边余数，${1}+${leftRem}+${rightRem}=${guiqi}。归奇拿出去，还剩 ${after} 策。`
  return { change, yao, before, left, right, leftRem, rightRem, leftKept, rightKept, guiqi, after, why }
}

function yaoFrom(start: number, yao: number, rng: () => number): YaoRec {
  const c1 = oneChange(start, yao, 1, rng)
  const c2 = oneChange(c1.after, yao, 2, rng)
  const c3 = oneChange(c2.after, yao, 3, rng)
  const changes = [c1, c2, c3]
  const final = c3.after
  const value = (final / 4) as YaoNum
  const info = YAO_INFO[value]
  const why = `三变之后剩 ${final} 策。系辞说「四营而成易」，用 4 去除，${final}÷4=${value}，是${info.name}（${info.symbol}）${info.moving ? '，这一爻要变' : '，这一爻不变'}。`
  return { yao, changes, final, value, why }
}

/** 十八变成一卦，自下而上。rng 缺省用 Math.random。 */
export function castHex(rng: () => number = Math.random): HexCast {
  const yaos: YaoRec[] = []
  for (let y = 1; y <= 6; y++) yaos.push(yaoFrom(49, y, rng))
  return { yaos, nums: yaos.map((y) => y.value) }
}

/** 只求爻数，给批量模拟用。 */
export function castYaoValue(rng: () => number = Math.random): YaoNum {
  let n = 49
  for (let c = 1; c <= 3; c++) n = oneChange(n, 1, c as 1 | 2 | 3, rng).after
  return (n / 4) as YaoNum
}

export function batchYarrow(times: number, rng: () => number = Math.random): Record<YaoNum, number> {
  const counts: Record<YaoNum, number> = { 6: 0, 7: 0, 8: 0, 9: 0 }
  for (let i = 0; i < times; i++) counts[castYaoValue(rng)]++
  return counts
}

/**
 * 朱熹《易学启蒙》的算法：每一变里，合法的余数组合当成同样可能。
 * 第一变 49 策，挂一之后是 48，两边余数之和必能被 4 整除，四种组合：
 * (1,3)(2,2)(3,1) 归奇 5、过揲 44；(4,4) 归奇 9、过揲 40。
 * 第二、三变从 44/40/36/32 出发，挂一之后余数之和除以 4 余 3，四种组合：
 * (1,2)(2,1) 归奇 4；(3,4)(4,3) 归奇 8。
 * 4×4×4=64 条路一样重，数一数就得到 6、7、8、9 各 4、20、28、12 条。
 */
export function yarrowEnumeration(): { total: number; counts: Record<YaoNum, number> } {
  const counts: Record<YaoNum, number> = { 6: 0, 7: 0, 8: 0, 9: 0 }
  const firstPartner = [0, 3, 2, 1, 4]
  const laterPartner = [0, 2, 1, 4, 3]
  for (const l1 of [1, 2, 3, 4] as const) {
    const s1 = 49 - (1 + l1 + firstPartner[l1])
    for (const l2 of [1, 2, 3, 4] as const) {
      const s2 = s1 - (1 + l2 + laterPartner[l2])
      for (const l3 of [1, 2, 3, 4] as const) {
        const s3 = s2 - (1 + l3 + laterPartner[l3])
        const v = s3 / 4
        if (v !== 6 && v !== 7 && v !== 8 && v !== 9) throw new Error(`穷举得到不能成爻的策数 ${s3}`)
        counts[v]++
      }
    }
  }
  return { total: 64, counts }
}

export function yarrowTheory(): Record<YaoNum, number> {
  const e = yarrowEnumeration()
  return { 6: e.counts[6] / e.total, 7: e.counts[7] / e.total, 8: e.counts[8] / e.total, 9: e.counts[9] / e.total }
}

/** 三枚钱各有字、背两面。back3：背 3 字 2；char3：字 3 背 2。八种结果一样重。 */
export function coinEnumeration(mode: CoinMode): { total: number; counts: Record<YaoNum, number> } {
  const counts: Record<YaoNum, number> = { 6: 0, 7: 0, 8: 0, 9: 0 }
  const faces = ['字', '背'] as const
  for (const a of faces) for (const b of faces) for (const c of faces) {
    let value = 0
    for (const face of [a, b, c]) {
      const back = face === '背'
      value += mode === 'back3' ? (back ? 3 : 2) : (back ? 2 : 3)
    }
    counts[value as YaoNum]++
  }
  return { total: 8, counts }
}

export function coinTheory(mode: CoinMode = 'back3'): Record<YaoNum, number> {
  const e = coinEnumeration(mode)
  return { 6: e.counts[6] / e.total, 7: e.counts[7] / e.total, 8: e.counts[8] / e.total, 9: e.counts[9] / e.total }
}

export function castCoinLine(mode: CoinMode, rng: () => number = Math.random): { faces: ('字' | '背')[]; value: YaoNum } {
  const faces: ('字' | '背')[] = [rng() < 0.5 ? '背' : '字', rng() < 0.5 ? '背' : '字', rng() < 0.5 ? '背' : '字']
  let value = 0
  for (const face of faces) {
    const back = face === '背'
    value += mode === 'back3' ? (back ? 3 : 2) : (back ? 2 : 3)
  }
  return { faces, value: value as YaoNum }
}

export function batchCoins(times: number, mode: CoinMode, rng: () => number = Math.random): Record<YaoNum, number> {
  const counts: Record<YaoNum, number> = { 6: 0, 7: 0, 8: 0, 9: 0 }
  for (let i = 0; i < times; i++) counts[castCoinLine(mode, rng).value]++
  return counts
}
