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
        ].map((x) => (
          <a key={x.k} className="mh-card" href={`#/atlas/${x.h.n}`}>
            <div className="mh-k">{x.k}</div>
            <Hex lines={x.h.lines} size={compact ? 46 : 58} moving={x.moving} />
            <div className="mh-name">{x.h.name}</div>
            <div className="mh-full">{x.h.fullName}</div>
            <div className="mh-sub">{x.sub}</div>
          </a>
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
