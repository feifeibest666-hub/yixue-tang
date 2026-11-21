import type { Lesson, QA, Quiz, SceneKey, Screen, Tag, ToolName, WidgetName } from '../types'

export const T = (title: string, body: string, tag?: Tag): Screen => ({ t: 'text', title, body, tag })
export const W = (w: WidgetName, title: string, body?: string): Screen => ({ t: 'widget', w, title, body })
export const H = (n: number, title: string): Screen => ({ t: 'hex', n, title })
export const Qt = (title: string, src: string, text: string, note?: string): Screen =>
  ({ t: 'quote', title, src, text, ...(note ? { note } : {}) })
export const Cmp = (title: string, focus: string, items: { who: string; view: string }[], diff: string): Screen =>
  ({ t: 'compare', title, focus, items, diff })
export const Teach = (title: string, prompt: string, points: string[]): Screen => ({ t: 'teach', title, prompt, points })
export const Task = (title: string, items: string[], tool?: ToolName): Screen =>
  ({ t: 'task', title, items, ...(tool ? { tool } : {}) })
export const Chain = (title: string, steps: string[]): Screen => ({ t: 'chain', title, steps })
export const Q = (q: string, opts: string[], a: number, ex: string): Quiz => ({ q, opts, a, ex })

/** 进阶一课。kind：新课 / 练习 / 复盘。qa 可空。 */
export const A = (
  day: number, unit: string, kind: '新' | '练' | '复', scene: SceneKey,
  title: string, subtitle: string, goal: string,
  screens: Screen[], quiz: Quiz[], qa: QA[] = [], minutes = 20,
): Lesson => ({
  day, unit, kind, scene, title, subtitle, goal, screens, quiz, minutes,
  ...(qa.length ? { qa } : {}),
})
