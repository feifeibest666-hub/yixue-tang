import { useState } from 'react'
import { HEXAGRAMS } from '../data/bagua'
import { PlateView } from '../components/adv/LiuyaoMini'
import { isYaoNum } from '../lib/dayan'
import { plateFromNumbers } from '../lib/liuyao'
import { todayStr, update, useStore, type SavedCase } from '../lib/store'

const METHOD: Record<SavedCase['method'], string> = {
  time: '梅花·时间', number: '梅花·数字', liuyao: '六爻', dayan: '大衍',
}

export function JournalPage() {
  const s = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const stats = summarize(s.cases)
  const download = () => {
    const blob = new Blob([JSON.stringify(s.cases, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `占筮日记-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/divine" className="back" aria-label="返回">‹</a>
        <div className="lh-mid"><div className="lh-day">工具</div><div className="lh-title">占筮日记</div></div>
        <button type="button" className="btn ghost sm" onClick={download}>导出</button>
      </header>
      {s.cases.length === 0 && <section className="card">还没有占例。梅花在起卦页保存，六爻在排盘页保存。</section>}
      {s.cases.map((c) => (
        <section key={c.id} className="card case-edit">
          <button type="button" className="case-toggle" onClick={() => setOpen(open === c.id ? null : c.id)}>
            <b>{c.question}</b>
            <span>{METHOD[c.method]} · {new Date(c.createdAt).toLocaleDateString('zh-CN')} · {hitLabel(c.hit)}</span>
          </button>
          {open === c.id && <CaseForm c={c} />}
        </section>
      ))}
      <Stats stats={stats} />
    </div>
  )
}

function CaseForm({ c }: { c: SavedCase }) {
  const [question, setQuestion] = useState(c.question)
  const [deadline, setDeadline] = useState(c.deadline ?? '')
  const [prediction, setPrediction] = useState(c.prediction ?? '')
  const [confidence, setConfidence] = useState(c.confidence == null ? '' : String(c.confidence))
  const [outcome, setOutcome] = useState(c.outcome)
  const [hit, setHit] = useState<SavedCase['hit']>(c.hit)
  const [review, setReview] = useState(c.review)
  const [ok, setOk] = useState(false)
  const ben = HEXAGRAMS[c.benN - 1]
  const zhi = HEXAGRAMS[c.bianN - 1]
  const rawOk = c.raw?.length === 6 && c.raw.every(isYaoNum)
  const when = c.params.time ? new Date(c.params.time) : new Date(c.createdAt)
  const plate = c.method === 'liuyao' && rawOk && !Number.isNaN(when.getTime()) ? plateFromNumbers(c.raw!, when) : null
  const save = () => {
    const n = confidence.trim() === '' ? undefined : Math.min(100, Math.max(0, Math.round(Number(confidence))))
    update((st) => {
      const x = st.cases.find((y) => y.id === c.id)
      if (!x) return
      x.question = question.trim() || x.question
      x.deadline = deadline || undefined
      x.prediction = prediction
      x.confidence = n == null || Number.isNaN(n) ? undefined : n
      x.outcome = outcome
      x.hit = hit
      x.review = review
    })
    setOk(true)
    window.setTimeout(() => setOk(false), 1200)
  }
  return (
    <div className="case-form">
      {ben && <p className="muted">{ben.fullName}{zhi ? ` 之 ${zhi.fullName}` : ''}{c.inputLabel ? ` · ${c.inputLabel}` : ''}</p>}
      {plate && <PlateView plate={plate} />}
      <label className="field">所问之事<input value={question} maxLength={100} onChange={(e) => setQuestion(e.target.value)} /></label>
      <label className="field">期限<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
      <label className="field">事先写下的预测<textarea rows={3} value={prediction} maxLength={1000} onChange={(e) => setPrediction(e.target.value)} /></label>
      <label className="field">置信度 {confidence === '' ? '未填' : confidence}
        <input type="range" min={0} max={100} value={confidence === '' ? 0 : Number(confidence)} onChange={(e) => setConfidence(e.target.value)} />
      </label>
      <label className="field">实际结果<textarea rows={2} value={outcome} maxLength={1000} onChange={(e) => setOutcome(e.target.value)} /></label>
      <div className="seg">
        {([[undefined, '未判'], ['hit', '命中'], ['miss', '未中'], ['unclear', '说不清']] as const).map(([v, label]) => (
          <button key={label} type="button" className={hit === v ? 'on' : ''} onClick={() => setHit(v)}>{label}</button>
        ))}
      </div>
      <label className="field">复盘<textarea rows={3} value={review} maxLength={2000} onChange={(e) => setReview(e.target.value)} /></label>
      <div className="row">
        <button type="button" className="btn primary sm" onClick={save}>{ok ? '已保存' : '保存这条'}</button>
        <button type="button" className="btn danger sm" onClick={() => { if (confirm('删除这条占例？')) update((st) => { st.cases = st.cases.filter((y) => y.id !== c.id) }) }}>删除</button>
      </div>
    </div>
  )
}

interface Bucket { label: string; n: number; hits: number; mean: number | null }
interface Summary {
  byMethod: { method: string; n: number }[]
  decided: number
  hits: number
  hitRate: number | null
  brierN: number
  brier: number | null
  buckets: Bucket[]
}

function summarize(cases: SavedCase[]): Summary {
  const byMethod = (Object.keys(METHOD) as SavedCase['method'][]).map((method) => ({
    method: METHOD[method], n: cases.filter((c) => c.method === method).length,
  }))
  const decided = cases.filter((c) => c.hit === 'hit' || c.hit === 'miss')
  const hits = decided.filter((c) => c.hit === 'hit').length
  const scored = decided.filter((c) => typeof c.confidence === 'number')
  const brier = scored.length
    ? scored.reduce((sum, c) => {
      const p = (c.confidence ?? 0) / 100
      const o = c.hit === 'hit' ? 1 : 0
      return sum + (p - o) ** 2
    }, 0) / scored.length
    : null
  const ranges: { label: string; test: (n: number) => boolean }[] = [
    { label: '0–20', test: (n) => n <= 20 },
    { label: '20–40', test: (n) => n > 20 && n <= 40 },
    { label: '40–60', test: (n) => n > 40 && n <= 60 },
    { label: '60–80', test: (n) => n > 60 && n <= 80 },
    { label: '80–100', test: (n) => n > 80 && n <= 100 },
  ]
  const buckets = ranges.map((range) => {
    const group = scored.filter((c) => range.test(c.confidence ?? 0))
    const h = group.filter((c) => c.hit === 'hit').length
    const mean = group.length ? group.reduce((s, c) => s + (c.confidence ?? 0), 0) / group.length : null
    return { label: range.label, n: group.length, hits: h, mean }
  })
  return {
    byMethod, decided: decided.length, hits, hitRate: decided.length ? hits / decided.length : null,
    brierN: scored.length, brier, buckets,
  }
}

function Stats({ stats }: { stats: Summary }) {
  const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 1000) / 10}%`)
  return (
    <section className="card stats-card">
      <h3>统计</h3>
      <ul className="stat-list">
        {stats.byMethod.map((m) => <li key={m.method}><b>{m.n}</b>{m.method}</li>)}
      </ul>
      <p className="stat-line">各方法的条数，把全部占例按起卦方法分开数，不管后来有没有对上。</p>
      <p className="stat-num">命中率 {pct(stats.hitRate)} <small>（{stats.hits}/{stats.decided}）</small></p>
      <p className="stat-line">只统计已经判了命中或未中的占例，说不清和还没判的不算。命中率 = 命中条数 ÷（命中 + 未中）。</p>
      <p className="stat-num">Brier {stats.brier == null ? '—' : stats.brier.toFixed(3)} <small>（{stats.brierN} 条）</small></p>
      <p className="stat-line">只统计写了置信度、并且判了命中或未中的占例。置信度换成 0 到 1 的 p，命中记 1、未中记 0，每条算 (p − 结果)²，再取平均。0 是概率和结果完全一致，1 是完全相反。</p>
      {stats.buckets.map((b) => (
        <div key={b.label} className="bucket">
          <b>{b.label}</b>
          <span>{b.n ? `${b.hits}/${b.n} · 实际 ${pct(b.hits / b.n)} · 平均置信 ${b.mean?.toFixed(0)}` : '这一段还没有'}</span>
        </div>
      ))}
      <p className="stat-line">置信度 0–20 含 20，之后每段不含下限、含上限，100 落在 80–100。每段只留已判命中或未中、并且写了置信度的占例。实际命中率 = 这段的命中条数 ÷ 这段条数，用来和这段的平均置信度对照。</p>
    </section>
  )
}

function hitLabel(hit: SavedCase['hit']) {
  if (hit === 'hit') return '命中'
  if (hit === 'miss') return '未中'
  if (hit === 'unclear') return '说不清'
  return '未判'
}
