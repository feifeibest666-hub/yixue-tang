import { motion } from 'motion/react'
import { Hex } from './Hex'
import type { MeihuaResult } from '../lib/meihua'
import { RELATION_MEANING, yaoTitle } from '../data/bagua'

export function MeihuaResultView({ r, compact }: { r: MeihuaResult; compact?: boolean }) {
  const movingYao = r.ben.yao[r.moving - 1]
  const movingBai = r.ben.yaoBai[r.moving - 1]
  const tiInUpper = r.tiPos === '上卦'
  return (
    <div className="mh-result">
      <div className="mh-trio">
        {[
          { k: '本卦', h: r.ben, sub: '开始 · 现状', moving: r.moving },
          { k: '互卦', h: r.hu, sub: '过程' },
          { k: '变卦', h: r.bian, sub: '结果' },
        ].map((x, i) => (
          <motion.a key={`${x.k}-${x.h.n}-${r.moving}-${r.inputLabel}`} className="mh-card" href={`#/atlas/${x.h.n}`}
            initial={compact ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.35, duration: 0.5 }}>
            <div className="mh-k">{x.k}</div>
            <DelayedHex lines={x.h.lines} size={compact ? 46 : 58} moving={x.moving} delay={compact ? -1 : i * 0.35} />
            <div className="mh-name">{x.h.name}</div>
            <div className="mh-full">{x.h.fullName}</div>
            <div className="mh-sub">{x.sub}</div>
          </motion.a>
        ))}
      </div>

      <div className="tiyong">
        <div className={`ty ${tiInUpper ? 'is-ti' : 'is-yong'}`}>
          <span className="ty-tag">{tiInUpper ? '体' : '用'}</span>上卦 {r.ben.upper.name}（{r.ben.upper.nature}·{r.ben.upper.wuxing}）
        </div>
        <div className={`ty ${!tiInUpper ? 'is-ti' : 'is-yong'}`}>
          <span className="ty-tag">{!tiInUpper ? '体' : '用'}</span>下卦 {r.ben.lower.name}（{r.ben.lower.nature}·{r.ben.lower.wuxing}）
        </div>
        <div className={`rel rel-${RELATION_MEANING[r.relation].level}`}>
          {r.relation} · {RELATION_MEANING[r.relation].level}
        </div>
      </div>

      <ul className="summary">
        {r.summary.map((s) => <li key={s}>{s}</li>)}
        {r.season && <li>卦气：{r.season.zhi}月{r.season.wx}旺，体卦{r.ti.wuxing}为「{r.season.tiState}」</li>}
      </ul>

      <details className="steps" open={!compact}>
        <summary>计算步骤（{r.steps.length} 步）</summary>
        <ol>{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </details>

      {!compact && (
        <div className="moving-text">
          <div className="label">动爻爻辞 · {yaoTitle(r.moving - 1, r.ben.lines[r.moving - 1])}</div>
          <p className="classic">{movingYao}</p>
          <p className="bai">{movingBai}</p>
        </div>
      )}
    </div>
  )
}

function DelayedHex({ delay, ...p }: Parameters<typeof Hex>[0] & { delay: number }) {
  if (delay < 0) return <Hex {...p} />
  return (
    <motion.div initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ delay: delay + 0.1, duration: 0.7, ease: [0.3, 0.6, 0.2, 1] }}>
      <Hex {...p} />
    </motion.div>
  )
}
