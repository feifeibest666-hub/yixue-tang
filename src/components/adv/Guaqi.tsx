import { useState } from 'react'
import { Hex } from '../Hex'
import { trigramByName, yaoTitle, type Line } from '../../data/bagua'
import { currentJieQi } from '../../lib/ganzhi'

const JIE = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪']
const HOSTS = ['坎', '震', '离', '兑'] as const

function slot(i: number) {
  const gua = HOSTS[Math.floor(i / 6)]
  const pos = i % 6
  const tri = trigramByName(gua)
  const lines = [...tri.lines, ...tri.lines] as Line[]
  return { gua, pos, lines, yao: yaoTitle(pos, lines[pos]), jie: JIE[i] }
}

export default function Guaqi() {
  const today = currentJieQi(new Date())
  const at = JIE.indexOf(today.name)
  const [sel, setSel] = useState(at < 0 ? 0 : at)
  const cur = slot(sel)
  return (
    <div className="adv" data-widget="guaqi">
      <div className="ring-box qi">
        {JIE.map((name, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / 24
          return (
            <button type="button" key={name} className={`qi-item host-${Math.floor(i / 6)} ${i === sel ? 'on' : ''} ${i === at ? 'today' : ''}`}
              style={{ left: `${50 + Math.cos(t) * 40}%`, top: `${50 + Math.sin(t) * 40}%` }}
              onClick={() => setSel(i)}>
              {name}
            </button>
          )
        })}
        <div className="ring-core">
          <Hex lines={cur.lines} size={46} highlight={[cur.pos + 1]} />
          <b>{cur.gua} · {cur.yao}</b>
        </div>
      </div>
      <p className="hint">四正卦二十四爻分管二十四节气：坎从冬至到惊蛰，震从春分到芒种，离从夏至到白露，兑从秋分到大雪。今天在「{today.name || '节气未定'}」，值{cur.gua}卦{cur.yao}。{today.why}这是汉易卦气里好教的一种排法。</p>
    </div>
  )
}
