import { HEXAGRAMS } from '../../data/bagua'

const KEYS = ['吉', '凶', '悔', '吝', '厉', '无咎'] as const
type Key = (typeof KEYS)[number]

function present(text: string): Record<Key, boolean> {
  const masked = text.replaceAll('不吉', '○')
  const wujiu = masked.includes('无咎')
  const rest = masked.replaceAll('无咎', '').replaceAll('无悔', '○')
  return {
    吉: rest.includes('吉'),
    凶: rest.includes('凶'),
    悔: rest.includes('悔'),
    吝: rest.includes('吝'),
    厉: rest.includes('厉'),
    无咎: wujiu,
  }
}

interface Row { label: string; items: Record<Key, boolean>[] }

function build(): Row[] {
  const lines: { pos: number; proper: boolean; center: boolean; ying: boolean; hit: Record<Key, boolean> }[] = []
  for (const hex of HEXAGRAMS) {
    for (let i = 0; i < 6; i++) {
      const pair = [3, 4, 5, 0, 1, 2][i]
      lines.push({
        pos: i,
        proper: (hex.lines[i] === 1) === (i % 2 === 0),
        center: i === 1 || i === 4,
        ying: hex.lines[pair] !== hex.lines[i],
        hit: present(hex.yao[i]),
      })
    }
  }
  const pack = (label: string, group: typeof lines): Row => ({
    label,
    items: group.map((g) => g.hit),
  })
  const posName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
  return [
    ...posName.map((label, i) => pack(label, lines.filter((l) => l.pos === i))),
    pack('当位', lines.filter((l) => l.proper)),
    pack('不当位', lines.filter((l) => !l.proper)),
    pack('居中', lines.filter((l) => l.center)),
    pack('不中', lines.filter((l) => !l.center)),
    pack('有应', lines.filter((l) => l.ying)),
    pack('无应', lines.filter((l) => !l.ying)),
  ]
}

const ROWS = build()

function tally(row: Row, key: Key) {
  const n = row.items.filter((item) => item[key]).length
  return { n, pct: row.items.length ? Math.round((n / row.items.length) * 100) : 0 }
}

export default function YaoStats() {
  return (
    <div className="adv" data-widget="yaoStats">
      <table className="adv-table stats">
        <thead>
          <tr><th />{KEYS.map((k) => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th>{row.label}<small>{row.items.length}</small></th>
              {KEYS.map((k) => {
                const t = tally(row, k)
                return <td key={k}>{t.n}<small>{t.pct}%</small></td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">384 条爻辞按词来数，一条里出现几次都只算这条有。元吉算有「吉」；「不吉」整段拿掉，不算吉。无悔也不算悔。无咎单列。这是词频，不是把爻辞判成吉或凶。</p>
    </div>
  )
}
