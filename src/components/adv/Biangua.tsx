import { useMemo, useState } from 'react'
import { Hex } from '../Hex'
import { YAO_INFO, castCoinLine, type YaoNum } from '../../lib/dayan'
import { readBianGua } from '../../lib/liuyao'
import { WhyBox } from './bits'
import { YAO_POS } from '../../data/bagua'

const CYCLE: YaoNum[] = [6, 7, 8, 9]

export default function Biangua() {
  const [nums, setNums] = useState<YaoNum[]>([8, 8, 7, 8, 7, 8])
  const reading = useMemo(() => readBianGua(nums), [nums])
  const setAt = (i: number) => setNums((xs) => xs.map((n, k) => (k === i ? CYCLE[(CYCLE.indexOf(n) + 1) % 4] : n)))
  return (
    <div className="adv" data-widget="biangua">
      <div className="num-picks">
        {[...nums].reverse().map((n, rev) => {
          const i = 5 - rev
          return (
            <button type="button" key={i} onClick={() => setAt(i)}>
              <b>{n}</b>
              <small>{YAO_POS[i]} · {YAO_INFO[n].symbol}</small>
            </button>
          )
        })}
      </div>
      <div className="pair-hex">
        <div><Hex lines={reading.ben.lines} size={72} highlight={reading.moving} /><b>本卦 {reading.ben.name}</b></div>
        <div><Hex lines={reading.zhi.lines} size={72} /><b>之卦 {reading.zhi.name}</b></div>
      </div>
      <WhyBox title={`${reading.count} 爻动`} text={`${reading.rule}${reading.why}`} />
      {reading.texts.map((t, i) => (
        <div key={i} className="quote-line">
          <em>{t.role} · {t.from}</em>
          <p>{t.text}</p>
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={() => setNums(Array.from({ length: 6 }, () => castCoinLine('back3').value))}>用铜钱随机</button>
      <p className="hint">点一爻，在 6、7、8、9 之间换。文字按朱熹《易学启蒙·考变占》。</p>
    </div>
  )
}
