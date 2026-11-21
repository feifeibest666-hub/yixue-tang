import { useState } from 'react'
import { Hex } from '../Hex'
import { HEXAGRAMS, type Line } from '../../data/bagua'
import { boshuOrder, palaceChart, xiantianOrder } from '../../lib/liuyao'

type Kind = '通行本' | '帛书' | '八宫' | '先天'

const ORDER: Kind[] = ['通行本', '帛书', '八宫', '先天']

export default function Guaxu() {
  const [kind, setKind] = useState<Kind>('通行本')
  const [name, setName] = useState('乾')
  const rows = rowsOf(kind)
  return (
    <div className="adv" data-widget="guaxu">
      <div className="seg">
        {ORDER.map((k) => <button key={k} type="button" className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k}</button>)}
      </div>
      <div className="xu">
        {rows.map((row) => (
          <div key={row.label} className="xu-row">
            {row.label && <b>{row.label}</b>}
            {row.hexes.map((hex) => (
              <button type="button" key={`${row.label}-${hex.n}`} className={name === hex.name ? 'on' : ''} onClick={() => setName(hex.name)} aria-label={hex.name}>
                <Hex lines={hex.lines as Line[]} size={24} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="hint">{name}。{blurb(kind)}</p>
    </div>
  )
}

function rowsOf(kind: Kind): { label: string; hexes: typeof HEXAGRAMS }[] {
  if (kind === '通行本') {
    return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ label: '', hexes: HEXAGRAMS.slice(i * 8, i * 8 + 8) }))
  }
  if (kind === '先天') {
    const all = xiantianOrder()
    return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ label: '', hexes: all.slice(i * 8, i * 8 + 8) }))
  }
  if (kind === '帛书') {
    const all = boshuOrder()
    const labels = ['乾', '艮', '坎', '震', '坤', '兑', '离', '巽']
    return labels.map((label, i) => ({ label, hexes: all.slice(i * 8, i * 8 + 8) }))
  }
  return palaceChart().map((row) => ({ label: row.palace, hexes: row.slots.map((s) => s.hex) }))
}

function blurb(kind: Kind) {
  if (kind === '通行本') return '通行本就是现在的卦序，从乾、坤排到既济、未济。'
  if (kind === '帛书') return '帛书按上卦分组：乾、艮、坎、震、坤、兑、离、巽。每组先放重卦，其余下卦按乾、坤、艮、兑、坎、离、震、巽。'
  if (kind === '八宫') return '京房八宫。每一行从本宫、一世排到游魂、归魂。'
  return '先天序把上爻当作最低位，阴爻记 1、阳爻记 0。乾是开头，坤是最后。'
}
