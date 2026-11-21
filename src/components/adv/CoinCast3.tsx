import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Hex } from '../Hex'
import { YAO_INFO, castCoinLine, type CoinMode, type YaoNum } from '../../lib/dayan'
import { readBianGua } from '../../lib/liuyao'
import { CoinFace } from './bits'

export default function CoinCast3() {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<CoinMode>('back3')
  const [faces, setFaces] = useState<('字' | '背')[]>(['字', '字', '字'])
  const [nums, setNums] = useState<YaoNum[]>([])
  const [spin, setSpin] = useState(false)
  const [flip, setFlip] = useState(0)
  const done = nums.length === 6
  const reading = done ? readBianGua(nums) : null
  const toss = () => {
    if (spin || done) return
    const got = castCoinLine(mode)
    setFaces(got.faces)
    setFlip((n) => n + 1)
    if (reduced) { setNums((xs) => [...xs, got.value]); return }
    setSpin(true)
    window.setTimeout(() => { setSpin(false); setNums((xs) => [...xs, got.value]) }, 980)
  }
  return (
    <div className="adv" data-widget="coinCast3">
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
          const n = nums[i]
          return <span key={i} className={n ? 'on' : ''}>{n ? `${n} ${YAO_INFO[n].symbol}` : `第 ${i + 1}`}</span>
        })}
      </div>
      {reading && (
        <div className="pair-hex">
          <div><Hex lines={reading.ben.lines} size={68} draw highlight={reading.moving} /><b>{reading.ben.fullName}</b></div>
          <div><Hex lines={reading.zhi.lines} size={68} /><b>{reading.moving.length ? reading.zhi.fullName : '六爻安静'}</b></div>
        </div>
      )}
      <div className="row">
        <button type="button" className="btn primary sm" disabled={done || spin} onClick={toss}>{done ? '六爻已成' : spin ? '钱在翻' : '三钱同掷'}</button>
        <button type="button" className="btn ghost sm" disabled={!nums.length || spin} onClick={() => setNums([])}>重来</button>
      </div>
      <p className="hint">{mode === 'back3' ? '默认背 3、字 2。' : '这一枚改成字 3、背 2。'}三枚相加：6 交、7 单、8 拆、9 重。两种记法下 6、7、8、9 仍是 1/8、3/8、3/8、1/8。</p>
    </div>
  )
}
