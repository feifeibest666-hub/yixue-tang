import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Hex } from '../Hex'
import { castHex, YAO_INFO, type HexCast } from '../../lib/dayan'
import { readBianGua } from '../../lib/liuyao'
import { WhyBox } from './bits'

const SUBS = ['分二', '挂一', '揲四', '归奇']

function Stalks({ n, kind }: { n: number; kind?: 'odd' | 'hang' }) {
  return (
    <div className={`stalks ${kind ?? ''}`} aria-hidden>
      {Array.from({ length: Math.max(0, n) }, (_, i) => <i key={i} />)}
    </div>
  )
}

export default function Dayan() {
  const reduced = useReducedMotion()
  const [cast, setCast] = useState<HexCast | null>(null)
  const [cursor, setCursor] = useState(0)
  const done = Boolean(cast) && cursor >= 72
  const changeIndex = Math.min(17, Math.floor(cursor / 4))
  const sub = cast && !done ? cursor % 4 : 3
  const yaoIndex = Math.floor(changeIndex / 3)
  const rec = cast?.yaos[yaoIndex]?.changes[changeIndex % 3]
  const finished = cast ? cast.yaos.filter((_, i) => cursor >= (i + 1) * 12) : []
  const reading = done && cast ? readBianGua(cast.nums) : null

  const start = () => { setCast(castHex()); setCursor(0) }

  return (
    <div className="adv" data-widget="dayan">
      {!cast && <p className="adv-lead">四十九策。每爻三变：分二、挂一、揲四、归奇。十八变出本卦和之卦。</p>}
      {cast && rec && (
        <motion.div key={reduced ? 'still' : cursor} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <div className="adv-kicker">第 {yaoIndex + 1} 爻 · 第 {(changeIndex % 3) + 1} 变 · {SUBS[sub]}</div>
          <div className="pile-row">
            <div className="pile"><b>左 {rec.left}</b><Stalks n={sub === 0 ? rec.left : rec.leftKept * 4} /></div>
            {sub >= 1 && <div className="pile hang"><b>挂 1</b><Stalks n={1} kind="hang" /></div>}
            <div className="pile"><b>右 {sub === 0 ? rec.right : rec.right - 1}</b><Stalks n={sub === 0 ? rec.right : rec.rightKept * 4} /></div>
          </div>
          {sub >= 2 && (
            <div className="pile-row odd-row">
              <div className="pile"><b>左余 {rec.leftRem}</b><Stalks n={rec.leftRem} kind="odd" /></div>
              <div className="pile"><b>右余 {rec.rightRem}</b><Stalks n={rec.rightRem} kind="odd" /></div>
              {sub === 3 && <div className="pile"><b>归奇 {rec.guiqi}</b><Stalks n={rec.guiqi} kind="odd" /></div>}
            </div>
          )}
          {sub === 3 && <WhyBox title={`过揲 ${rec.after}`} text={rec.why} />}
        </motion.div>
      )}
      {cast && (
        <div className="yao-score">
          {cast.yaos.map((yao, i) => {
            const show = finished.includes(yao)
            return <span key={i} className={show ? 'on' : ''}>{show ? `${yao.value} ${YAO_INFO[yao.value].symbol}` : '·'}</span>
          })}
        </div>
      )}
      {reading && (
        <div className="pair-hex">
          <div><Hex lines={reading.ben.lines} size={72} draw highlight={reading.moving} /><b>{reading.ben.fullName}</b></div>
          <div><Hex lines={reading.zhi.lines} size={72} draw /><b>{reading.moving.length ? reading.zhi.fullName : '无变爻'}</b></div>
        </div>
      )}
      {done && cast && <WhyBox title="三变成爻" text={cast.yaos.map((y) => `第 ${y.yao} 爻：${y.why}`).join('')} />}
      <div className="row">
        <button type="button" className="btn primary sm" onClick={start}>{cast ? '重新起筮' : '起筮'}</button>
        {cast && !done && <button type="button" className="btn ghost sm" onClick={() => setCursor((n) => Math.min(72, n + 1))}>下一步</button>}
        {cast && !done && <button type="button" className="btn ghost sm" onClick={() => setCursor(72)}>成卦</button>}
      </div>
      <p className="hint">左堆取在正中附近，像手里实际分开。教科书上的 1/16、5/16、7/16、3/16 则把合法余数当成同样可能，见旁边的概率对照。</p>
    </div>
  )
}
