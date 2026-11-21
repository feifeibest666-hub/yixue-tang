import { useEffect, useState, type ReactNode } from 'react'
import { YAO_INFO, castCoinLine } from '../../lib/dayan'
import { plateFromNumbers, type Plate, type PlateLine } from '../../lib/liuyao'
import { WhyBox, YaoMark } from './bits'

export function PlateView({ plate }: { plate: Plate }) {
  const [key, setKey] = useState<string | null>(null)
  const hit = (k: string, label: string, body?: ReactNode) => (
    <button type="button" className={`adv-hit ${key === k ? 'on' : ''}`} onClick={() => setKey(key === k ? null : k)}>
      {body ?? label}
    </button>
  )
  const w = plate.when
  const moved = plate.lines.some((l) => l.moving)
  const rows = [...plate.lines].reverse()
  const open = key ? noteOf(plate, key) : null
  return (
    <div className="ly">
      <div className="ly-head">
        {hit('year', `${w.year}年`)}
        {hit('month', `${w.month}月`)}
        {hit('day', `${w.day}日`)}
        {hit('time', `${w.time}时`)}
      </div>
      <div className="ly-head">
        {hit('yue', `月建 ${w.monthZhi}`)}
        {hit('ri', `日辰 ${w.day}`)}
        {hit('kong', `旬空 ${w.kong.join('')}`)}
      </div>
      <div className="ly-head">
        {hit('gong', `${plate.palace.palace}宫 · ${plate.palace.generation}`)}
        {hit('ben', plate.ben.fullName)}
        {hit('zhi', moved ? `之 ${plate.zhi.fullName}` : '无变爻')}
      </div>
      <div className="ly-flags">
        {hit('chong', plate.chongGua.yes ? '六冲卦' : '非六冲')}
        {hit('he', plate.heGua.yes ? '六合卦' : '非六合')}
        {hit('fan', plate.fanYin.yes ? '反吟' : '非反吟')}
        {hit('fu', plate.fuYin.yes ? '伏吟' : '非伏吟')}
      </div>
      <div className="ly-grid">
        <div className="ly-h">六神</div>
        <div className="ly-h">伏神</div>
        <div className="ly-h">六亲干支</div>
        <div className="ly-h">爻</div>
        <div className="ly-h">变爻</div>
        {rows.map((line) => (
          <LineRow key={line.pos} line={line} pick={key} setPick={setKey} />
        ))}
      </div>
      {open ? <WhyBox title={open.title} text={open.text} /> : <div className="hint">点任何一格，看它为什么这样排。</div>}
    </div>
  )
}

function LineRow({ line, pick, setPick }: {
  line: PlateLine
  pick: string | null
  setPick: (k: string | null) => void
}) {
  const info = YAO_INFO[line.num]
  const cell = (k: string, body: ReactNode) => (
    <button type="button" className={`adv-hit ${pick === k ? 'on' : ''}`} onClick={() => setPick(pick === k ? null : k)}>
      {body}
    </button>
  )
  return (
    <>
      {cell(`sp-${line.pos}`, line.spirit)}
      {cell(`fu-${line.pos}`, line.fu ? <>{line.fu.qin}<br />{line.fu.gz}</> : '—')}
      <div className="ly-stack">
        {cell(`qin-${line.pos}`, <>{line.qin}<br />{line.gz} {line.element}</>)}
        {line.flags.map((flag) => cell(`f-${line.pos}-${flag.label}`, flag.label))}
      </div>
      {cell(`yao-${line.pos}`, (
        <span className="ly-yao">
          <YaoMark yang={line.yinYang === 1} hot={line.moving} />
          <i className={line.shi || line.ying ? 'seal' : ''}>{line.shi ? '世' : line.ying ? '应' : info.symbol}</i>
        </span>
      ))}
      {cell(`chg-${line.pos}`, line.changed
        ? <>{line.changed.qin}<br />{line.changed.gz} {line.changed.element}{(line.changed.huiTou || line.changed.jinTui) && <em>{line.changed.huiTou ?? line.changed.jinTui}</em>}</>
        : '—')}
    </>
  )
}

export default function LiuyaoMini({ nums }: { nums?: number[] }) {
  const [own, setOwn] = useState<number[]>(() => (nums && nums.length === 6 ? nums : Array.from({ length: 6 }, () => castCoinLine('back3').value)))
  const sig = nums?.join(',') ?? ''
  useEffect(() => {
    if (nums && nums.length === 6) setOwn(nums)
  }, [sig])
  return (
    <div className="adv" data-widget="liuyaoMini">
      <button type="button" className="btn ghost sm" onClick={() => setOwn(Array.from({ length: 6 }, () => castCoinLine('back3').value))}>铜钱另摇一卦</button>
      <PlateView plate={plateFromNumbers(own, new Date())} />
    </div>
  )
}

function noteOf(plate: Plate, key: string): { title: string; text: string } | null {
  const w = plate.when
  const head: Record<string, { title: string; text: string }> = {
    year: { title: `${w.year}年`, text: w.why.year },
    month: { title: `${w.month}月`, text: w.why.month },
    day: { title: `${w.day}日`, text: w.why.day },
    time: { title: `${w.time}时`, text: w.why.time },
    yue: { title: `月建 ${w.monthZhi}`, text: w.why.month },
    ri: { title: `日辰 ${w.day}`, text: `日辰就是日柱。${w.why.day}` },
    kong: { title: `旬空 ${w.kong.join('')}`, text: w.why.kong },
    gong: { title: `${plate.palace.palace}宫 · ${plate.palace.generation}`, text: plate.palace.why },
    ben: { title: plate.ben.fullName, text: '本卦按六爻自下而上读。7、9 是阳，6、8 是阴；6 和 9 会变。' },
    zhi: {
      title: plate.lines.some((l) => l.moving) ? `之 ${plate.zhi.fullName}` : '无变爻',
      text: plate.lines.some((l) => l.moving) ? '之卦只翻转 6 和 9。变爻的干支从这张卦的纳甲来取。' : '六爻都是 7 或 8，之卦就是本卦。',
    },
    chong: { title: plate.chongGua.yes ? '六冲卦' : '非六冲', text: plate.chongGua.why },
    he: { title: plate.heGua.yes ? '六合卦' : '非六合', text: plate.heGua.why },
    fan: { title: plate.fanYin.yes ? '反吟' : '非反吟', text: plate.fanYin.why },
    fu: { title: plate.fuYin.yes ? '伏吟' : '非伏吟', text: plate.fuYin.why },
  }
  if (head[key]) return head[key]
  const flag = /^f-(\d)-(.+)$/.exec(key)
  if (flag) {
    const line = plate.lines[Number(flag[1]) - 1]
    const found = line?.flags.find((f) => f.label === flag[2])
    return found ? { title: found.label, text: found.why } : null
  }
  const m = /^(sp|fu|qin|yao|chg)-(\d)$/.exec(key)
  if (!m) return null
  const line = plate.lines[Number(m[2]) - 1]
  if (!line) return null
  const info = YAO_INFO[line.num]
  if (m[1] === 'sp') return { title: line.spirit, text: line.whySpirit }
  if (m[1] === 'fu') return { title: line.fu ? `${line.fu.qin} ${line.fu.gz}` : '无伏神', text: line.fuNote }
  if (m[1] === 'qin') return { title: `${line.qin} ${line.gz}${line.element}`, text: `${line.whyNajia}${line.whyQin}` }
  if (m[1] === 'yao') return { title: `${info.name} ${line.num}`, text: `${line.whyPos}数目 ${line.num} 是${info.name}，口诀记「${info.symbol}」。6 交、7 单、8 拆、9 重。` }
  return { title: line.changed ? `${line.changed.qin} ${line.changed.gz}` : '不变', text: line.changeNote }
}
