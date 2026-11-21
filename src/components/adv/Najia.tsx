import { Hex } from '../Hex'
import { installNajia, palaceChart } from '../../lib/liuyao'
import { zhiElement } from '../../lib/ganzhi'

export default function Najia() {
  const rows = palaceChart().map((row) => {
    const cells = installNajia(row.slots[0].hex)
    return { row, cells }
  })
  return (
    <div className="adv" data-widget="najia">
      <table className="adv-table najia">
        <thead>
          <tr><th>卦</th><th>内卦自下而上</th><th>外卦自下而上</th></tr>
        </thead>
        <tbody>
          {rows.map(({ row, cells }) => (
            <tr key={row.palace}>
              <th><Hex lines={row.slots[0].hex.lines} size={28} /><span>{row.palace}</span></th>
              <td>{cells.slice(0, 3).map((c) => <span key={c.gz}>{c.gz}{zhiElement(c.branch)}</span>)}</td>
              <td>{cells.slice(3).map((c) => <span key={c.gz}>{c.gz}{zhiElement(c.branch)}</span>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">干支跟八卦走，不跟整卦走。卦在下面用「内」，在上面用「外」。京房装卦就用这张表。</p>
    </div>
  )
}
