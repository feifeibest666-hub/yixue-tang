import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Hex } from '../components/Hex'
import { CoinFace } from '../components/adv/bits'
import { PlateView } from '../components/adv/LiuyaoMini'
import { YAO_POS, hexByLines, trigramByLines, type Line } from '../data/bagua'
import { YAO_INFO, castCoinLine, castHex, type CoinMode, type YaoNum } from '../lib/dayan'
import { numsFromLines, plateFromNumbers } from '../lib/liuyao'
import { castByTime } from '../lib/meihua'
import { update, type SavedCase } from '../lib/store'

type Method = 'coin' | 'yarrow' | 'manual' | 'time'
const LABEL: Record<Method, string> = { coin: '铜钱', yarrow: '蓍草', manual: '手输', time: '时间' }

const localInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const CYCLE: YaoNum[] = [7, 8, 9, 6]

export function LiuyaoPage() {
  const reduced = useReducedMotion()
  const [method, setMethod] = useState<Method>('coin')
  const [mode, setMode] = useState<CoinMode>('back3')
  const [when, setWhen] = useState(localInput(new Date()))
  const [manual, setManual] = useState<YaoNum[]>([7, 7, 7, 7, 7, 7])
  const [coinNums, setCoinNums] = useState<YaoNum[]>([])
  const [faces, setFaces] = useState<('字' | '背')[]>(['字', '字', '字'])
  const [spin, setSpin] = useState(false)
  const [flip, setFlip] = useState(0)
  const [yarrowNums, setYarrowNums] = useState<YaoNum[] | null>(null)
  const [question, setQuestion] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  const date = new Date(when)
  const dateOk = !Number.isNaN(date.getTime())
  const timeCast = method === 'time' && dateOk ? castByTime({ date, lateZiNextDay: date.getHours() === 23 }) : null
  const nums = method === 'coin' ? (coinNums.length === 6 ? coinNums : null)
    : method === 'yarrow' ? yarrowNums
    : method === 'manual' ? manual
    : timeCast ? numsFromLines(timeCast.ben.lines, [timeCast.moving]) : null
  const plate = nums && dateOk ? plateFromNumbers(nums, date) : null

  const toss = () => {
    if (spin || coinNums.length >= 6) return
    const got = castCoinLine(mode)
    setFaces(got.faces)
    setFlip((n) => n + 1)
    setSaved(null)
    if (reduced) { setCoinNums((xs) => [...xs, got.value]); return }
    setSpin(true)
    window.setTimeout(() => { setSpin(false); setCoinNums((xs) => [...xs, got.value]) }, 980)
  }

  const save = () => {
    if (!plate || !nums) return
    const id = Date.now().toString(36)
    const hu = hexByLines([...trigramByLines(plate.ben.lines.slice(1, 4)).lines, ...trigramByLines(plate.ben.lines.slice(2, 5)).lines])
    const moving = plate.lines.filter((l) => l.moving).map((l) => l.pos)
    const c: SavedCase = {
      id, createdAt: new Date().toISOString(),
      question: question.trim() || '（未填写所问之事）',
      method: 'liuyao',
      inputLabel: `${plate.ben.name} 之 ${plate.zhi.name} · ${LABEL[method]}`,
      params: { time: when },
      benN: plate.ben.n, huN: hu.n, bianN: plate.zhi.n,
      moving: moving[0] ?? 0,
      ti: plate.palace.palace, yong: plate.palace.generation,
      relation: moving.length ? `动爻 ${moving.join('、')}` : '六爻安静',
      myJudgement: '', outcome: '', review: '',
      raw: nums,
    }
    update((st) => { st.cases.unshift(c) })
    setSaved(id)
  }

  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/divine" className="back" aria-label="返回">‹</a>
        <div className="lh-mid"><div className="lh-day">工具</div><div className="lh-title">六爻排盘</div></div>
      </header>
      <section className="card">
        <div className="seg">
          {(Object.keys(LABEL) as Method[]).map((m) => (
            <button key={m} type="button" className={method === m ? 'on' : ''} onClick={() => { setMethod(m); setSaved(null) }}>{LABEL[m]}</button>
          ))}
        </div>
        <label className="field">所问之事
          <input value={question} maxLength={100} placeholder="先写下要问的事" onChange={(e) => setQuestion(e.target.value)} />
        </label>
        <label className="field">起卦时间（用来定月建、日辰、六神）
          <input type="datetime-local" value={when} onChange={(e) => { setWhen(e.target.value); setSaved(null) }} />
        </label>
        {method === 'coin' && (
          <>
            <div className="seg">
              <button type="button" className={mode === 'back3' ? 'on' : ''} onClick={() => setMode('back3')}>背为 3</button>
              <button type="button" className={mode === 'char3' ? 'on' : ''} onClick={() => setMode('char3')}>字为 3</button>
            </div>
            <div className="coins3">
              {faces.map((face, i) => (
                <div className="coin-stage sm" key={i}>
                  <motion.div className="coin sm" style={{ transformPerspective: 600 }} initial={false}
                    animate={{ rotateX: reduced ? 0 : flip * 360, y: spin && !reduced ? [0, -46, 0] : 0 }}
                    transition={{ duration: reduced ? 0 : 0.9, delay: i * 0.05 }}>
                    <CoinFace side={face} />
                  </motion.div>
                  <div className="coin-shadow" />
                </div>
              ))}
            </div>
            <div className="yao-score">
              {Array.from({ length: 6 }, (_, i) => {
                const n = coinNums[i]
                return <span key={i} className={n ? 'on' : ''}>{n ? `${n} ${YAO_INFO[n].symbol}` : `${i + 1}`}</span>
              })}
            </div>
            <div className="row">
              <button type="button" className="btn primary sm" disabled={spin || coinNums.length >= 6} onClick={toss}>三钱同掷</button>
              <button type="button" className="btn ghost sm" disabled={spin || !coinNums.length} onClick={() => { setCoinNums([]); setSaved(null) }}>重来</button>
            </div>
          </>
        )}
        {method === 'yarrow' && (
          <>
            <button type="button" className="btn primary" onClick={() => { setYarrowNums(castHex().nums); setSaved(null) }}>演成一卦</button>
            {yarrowNums && <div className="yao-score">{yarrowNums.map((n, i) => <span key={i} className="on">{n} {YAO_INFO[n].symbol}</span>)}</div>}
            <p className="hint">这里一次演完十八变。要一步一步看分挂揲归，用课里的大衍工具。</p>
          </>
        )}
        {method === 'manual' && (
          <div className="num-picks">
            {[...manual].reverse().map((n, rev) => {
              const i = 5 - rev
              return (
                <button type="button" key={i} onClick={() => { setManual((xs) => xs.map((v, k) => (k === i ? CYCLE[(CYCLE.indexOf(v) + 1) % 4] : v))); setSaved(null) }}>
                  <b>{n}</b>
                  <small>{YAO_POS[i]} · {YAO_INFO[n].symbol}</small>
                </button>
              )
            })}
          </div>
        )}
        {method === 'time' && timeCast && (
          <>
            <p className="tag tag-约定">约定</p>
            <p className="adv-lead">梅花时间起卦只用农历的年月日时，除以 8 得上下卦、除以 6 得一条动爻。它不产生六爻的 6、7、8、9。这里按静阳作 7、静阴作 8、动阳作 9、动阴作 6 填进去，才能装成一张盘。23 点按次日，好跟日柱的换日对齐。月建仍按节气，不按这套农历月。</p>
            <div className="pair-hex">
              <div><Hex lines={timeCast.ben.lines} size={64} moving={timeCast.moving} /><b>{timeCast.ben.fullName}</b></div>
              <div><Hex lines={timeCast.bian.lines as Line[]} size={64} /><b>之 {timeCast.bian.fullName}</b></div>
            </div>
            <ol className="time-steps">{timeCast.steps.slice(0, 6).map((s) => <li key={s}>{s}</li>)}</ol>
          </>
        )}
      </section>
      {plate && (
        <section className="card">
          <PlateView plate={plate} />
          {saved
            ? <a className="btn ghost block" href="#/journal">已存入占筮日记</a>
            : <button type="button" className="btn primary block" onClick={save}>存入占筮日记</button>}
        </section>
      )}
    </div>
  )
}
