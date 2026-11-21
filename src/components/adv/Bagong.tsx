import { useMemo, useState } from 'react'
import { YAO_POS } from '../../data/bagua'
import { numsFromLines, palaceChart } from '../../lib/liuyao'
import LiuyaoMini from './LiuyaoMini'

export default function Bagong() {
  const chart = palaceChart()
  const [pick, setPick] = useState('乾-0')
  const found = chart.flatMap((row) => row.slots.map((slot) => ({ row, slot }))).find(({ row, slot }) => `${row.palace}-${slot.index}` === pick)
  const nums = useMemo(() => (found ? numsFromLines(found.slot.hex.lines, []) : undefined), [pick])
  return (
    <div className="adv" data-widget="bagong">
      <div className="bg">
        <div className="bg-row head">
          <span />
          {['本', '一', '二', '三', '四', '五', '游', '归'].map((label) => <div key={label} className="ly-h">{label}</div>)}
        </div>
        {chart.map((row) => (
          <div key={row.palace} className="bg-row">
            <b>{row.palace}</b>
            {row.slots.map((slot) => (
              <button type="button" key={slot.index} className={pick === `${row.palace}-${slot.index}` ? 'on' : ''}
                onClick={() => setPick(`${row.palace}-${slot.index}`)}>
                {slot.hex.name}
                <small>世{YAO_POS[slot.shi - 1]}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
      {found && <p className="hint">{found.slot.why}</p>}
      <LiuyaoMini nums={nums} />
    </div>
  )
}
