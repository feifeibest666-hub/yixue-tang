import type { SceneKey } from './scenes'

export type { SceneKey }

export const WIDGET_NAMES = [
  'yinyangSort', 'taiji', 'yaoBrush', 'sixiangScene', 'trigramScene', 'taipi', 'coin3', 'coin6', 'lookup',
  'trigramCards', 'trigramExplorer', 'xiantianMap', 'houtianMap', 'wuxingCycle', 'hexBuilder', 'yaoPosition',
  'huBian', 'meihuaNumber',
  'dayan', 'probStats', 'coinCast3', 'biangua', 'transform', 'xiaoxi', 'guaqi', 'bagong', 'najia',
  'hetu', 'luoshu', 'xiantian64', 'ganzhiWheel', 'changsheng', 'yaoStats', 'liuyaoMini', 'guaxu',
] as const

export type WidgetName = (typeof WIDGET_NAMES)[number]

export type Tag = '为什么' | '结论' | '约定' | '例子' | '小结' | '原文' | '史实' | '推导' | '传统' | '争议' | '类比'

export type ToolName = 'liuyao' | 'dayan' | 'reader' | 'journal' | 'transform' | 'stats' | 'meihua'

export type Screen =
  | { t: 'text'; title: string; body: string; tag?: Tag }
  | { t: 'widget'; title: string; body?: string; w: WidgetName }
  | { t: 'hex'; title: string; n: number }
  | { t: 'quote'; title: string; src: string; text: string; note?: string }
  | { t: 'compare'; title: string; focus: string; items: { who: string; view: string }[]; diff: string }
  | { t: 'teach'; title: string; prompt: string; points: string[] }
  | { t: 'task'; title: string; items: string[]; tool?: ToolName }
  | { t: 'chain'; title: string; steps: string[] }

export interface Quiz { q: string; opts: string[]; a: number; ex: string }
export interface QA { q: string; a: string }
export interface Lesson {
  day: number; unit: string; title: string; subtitle: string; scene: SceneKey
  minutes: number; goal: string; screens: Screen[]; quiz: Quiz[]
  /** 选修课的编号，如“原理 3”；主线课没有 */
  elective?: string
  kind?: '新' | '练' | '复'
  qa?: QA[]
}
