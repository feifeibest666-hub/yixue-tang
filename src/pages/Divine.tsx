import { useState } from 'react'
import { castByNumber, castByTime, type MeihuaResult } from '../lib/meihua'
import { MeihuaResultView } from '../components/MeihuaResultView'
import { update, useStore, type SavedCase } from '../lib/store'
import { HEXAGRAMS } from '../data/bagua'
import { Hex } from '../components/Hex'

const localInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function DivinePage() {
  const s = useStore()
  const [method, setMethod] = useState<'time' | 'number'>('time')
  const [time, setTime] = useState(localInput(new Date()))
  const [lateZi, setLateZi] = useState(false)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [addHour, setAddHour] = useState(false)
  const [res, setRes] = useState<MeihuaResult | null>(null)
  const [question, setQuestion] = useState('')
  const [judge, setJudge] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const cast = () => {
    setErr(''); setSaved(null)
    if (method === 'time') {
      const d = new Date(time)
      if (isNaN(d.getTime())) return setErr('请选择正确的时间')
      setRes(castByTime({ date: d, lateZiNextDay: lateZi }))
    } else {
      const na = parseInt(a, 10), nb = parseInt(b, 10)
      if (!(na > 0 && nb > 0)) return setErr('请输入两个正整数')
      setRes(castByNumber(na, nb, addHour))
    }
  }

  const save = () => {
    if (!res) return
    const id = Date.now().toString(36)
    const c: SavedCase = {
      id, createdAt: new Date().toISOString(), question: question.trim() || '（未填写所问之事）', method: res.method, inputLabel: res.inputLabel,
      params: method === 'time' ? { time, lateZi } : { a: Number(a), b: Number(b), addHour },
      benN: res.ben.n, huN: res.hu.n, bianN: res.bian.n, moving: res.moving, ti: res.ti.name, yong: res.yong.name, relation: res.relation,
      myJudgement: judge.trim(), outcome: '', review: '',
    }
    update((st) => { st.cases.unshift(c) })
    setSaved(id)
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>梅花易数起卦</h1>
        <a className="btn ghost sm" href="#/cases">我的占例 {s.cases.length ? `(${s.cases.length})` : ''}</a>
      </header>
      <section className="card">
        <div className="seg">
          <button className={method === 'time' ? 'on' : ''} onClick={() => setMethod('time')}>时间起卦</button>
          <button className={method === 'number' ? 'on' : ''} onClick={() => setMethod('number')}>数字起卦</button>
        </div>
        <label className="field">所问之事（可选）
          <input value={question} maxLength={100} placeholder="例如：这周的学习计划能否完成" onChange={(e) => setQuestion(e.target.value)} />
        </label>
        {method === 'time' ? (
          <>
            <label className="field">起卦时间（公历，自动换算农历）
              <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setTime(localInput(new Date()))}>用现在的时间</button>
              <label className="check"><input type="checkbox" checked={lateZi} onChange={(e) => setLateZi(e.target.checked)} />23 点后按次日算</label>
            </div>
          </>
        ) : (
          <>
            <div className="num-row">
              <label>前数（上卦）<input inputMode="numeric" value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, '').slice(0, 9))} /></label>
              <label>后数（下卦）<input inputMode="numeric" value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, '').slice(0, 9))} /></label>
            </div>
            <label className="check"><input type="checkbox" checked={addHour} onChange={(e) => setAddHour(e.target.checked)} />动爻加上当前时辰数</label>
          </>
        )}
        {err && <div className="explain bad">{err}</div>}
        <button className="btn primary block mt" onClick={cast}>起卦</button>
      </section>

      {res && (
        <section className="card">
          <h3>卦象 · {res.inputLabel}</h3>
          <MeihuaResultView r={res} />
          <div className="save-box">
            <label className="field">我的推断（先自己写，再对照）
              <textarea rows={3} value={judge} maxLength={1000} onChange={(e) => setJudge(e.target.value)} placeholder="例如：用克体，开始不顺；变卦用生体，后面会好转……" />
            </label>
            {saved ? (
              <a className="btn ghost block" href={`#/case/${saved}`}>已保存 ✓ 去写复盘 →</a>
            ) : (
              <button className="btn primary block" onClick={save}>保存为占例</button>
            )}
          </div>
        </section>
      )}
      <p className="source-note">起卦用于学习原理。时间起卦：上卦=(年支+农历月+日)÷8，下卦=(年支+月+日+时)÷8，动爻=(年支+月+日+时)÷6；余 0 作 8 或 6。</p>
    </div>
  )
}

export function CasesPage() {
  const s = useStore()
  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/divine" className="back">‹</a>
        <div className="lh-mid"><div className="lh-day">梅花易数</div><div className="lh-title">我的占例</div></div>
      </header>
      {s.cases.length === 0 && <div className="card center">还没有占例。去起一卦吧。</div>}
      {s.cases.map((c) => {
        const ben = HEXAGRAMS[c.benN - 1], bian = HEXAGRAMS[c.bianN - 1]
        return (
          <a key={c.id} href={`#/case/${c.id}`} className="card case-row">
            <Hex lines={ben.lines} size={40} moving={c.moving} />
            <div className="grow">
              <b>{c.question}</b>
              <div className="muted">{ben.name} 之 {bian.name} · {c.relation} · {new Date(c.createdAt).toLocaleDateString('zh-CN')}</div>
            </div>
            <span className={`ll-st ${c.review ? 'st-已学' : 'st-待补'}`}>{c.review ? '已复盘' : '待复盘'}</span>
          </a>
        )
      })}
    </div>
  )
}

export function CaseDetail({ id }: { id: string }) {
  const s = useStore()
  const c = s.cases.find((x) => x.id === id)
  const [outcome, setOutcome] = useState(c?.outcome ?? '')
  const [review, setReview] = useState(c?.review ?? '')
  const [judge, setJudge] = useState(c?.myJudgement ?? '')
  const [ok, setOk] = useState(false)
  if (!c) return <div className="page"><a href="#/cases">返回</a><p>找不到这个占例。</p></div>
  const r = c.method === 'time'
    ? castByTime({ date: new Date(c.params.time!), lateZiNextDay: Boolean(c.params.lateZi) })
    : castByNumber(c.params.a!, c.params.b!, Boolean(c.params.addHour), new Date(c.createdAt))
  const saveIt = () => {
    update((st) => {
      const x = st.cases.find((y) => y.id === id)
      if (x) { x.outcome = outcome; x.review = review; x.myJudgement = judge }
    })
    setOk(true); setTimeout(() => setOk(false), 1500)
  }
  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/cases" className="back">‹</a>
        <div className="lh-mid"><div className="lh-day">{new Date(c.createdAt).toLocaleString('zh-CN')}</div><div className="lh-title">{c.question}</div></div>
      </header>
      <section className="card"><MeihuaResultView r={r} /></section>
      <section className="card">
        <h3>复盘笔记</h3>
        <label className="field">当时的推断<textarea rows={3} value={judge} maxLength={1000} onChange={(e) => setJudge(e.target.value)} /></label>
        <label className="field">实际结果<textarea rows={3} value={outcome} maxLength={1000} onChange={(e) => setOutcome(e.target.value)} placeholder="事情最后怎么样了？" /></label>
        <label className="field">复盘：哪里推对了，哪里偏了？<textarea rows={4} value={review} maxLength={2000} onChange={(e) => setReview(e.target.value)} placeholder="对照体用、互卦、变卦、类象逐条检查……" /></label>
        <div className="row">
          <button className="btn primary grow" onClick={saveIt}>{ok ? '已保存 ✓' : '保存'}</button>
          <button className="btn danger" onClick={() => { if (confirm('删除这个占例？')) { update((st) => { st.cases = st.cases.filter((y) => y.id !== id) }); window.location.hash = '#/cases' } }}>删除</button>
        </div>
      </section>
    </div>
  )
}
