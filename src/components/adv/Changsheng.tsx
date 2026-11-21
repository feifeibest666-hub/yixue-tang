import { useState } from 'react'
import { ZHI, changShengAt } from '../../lib/ganzhi'
import type { WuXing } from '../../data/bagua'
import { WhyBox } from './bits'

const WX: WuXing[] = ['木', '火', '土', '金', '水']

export default function Changsheng() {
  const [pick, setPick] = useState<{ el: WuXing; zhi: string } | null>(null)
  const note = pick ? changShengAt(pick.el, pick.zhi) : null
  return (
    <div className="adv" data-widget="changsheng">
      <table className="adv-table cs">
        <thead>
          <tr><th>支</th>{WX.map((el) => <th key={el}>{el}{el === '土' ? '*' : ''}</th>)}</tr>
        </thead>
        <tbody>
          {ZHI.map((zhi) => (
            <tr key={zhi}>
              <th>{zhi}</th>
              {WX.map((el) => {
                const cell = changShengAt(el, zhi)
                const on = pick?.el === el && pick.zhi === zhi
                return (
                  <td key={el}>
                    <button type="button" className={`${on ? 'on' : ''} ${cell.stage === '长生' ? 'born' : ''}`} onClick={() => setPick({ el, zhi })}>
                      {cell.stage}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {note && pick && <WhyBox title={`${pick.el} 在 ${pick.zhi} · ${note.stage}`} text={note.why} />}
      <p className="hint">五行长生：木在亥，火在寅，金在巳，水在申。土走水的表，长生也在申，这是约定。点一格可以看它是怎么数出来的。</p>
    </div>
  )
}
