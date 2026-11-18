import { HEXAGRAMS, yaoTitle, type Trigram } from '../data/bagua'
import { TRIGRAM_WHY } from '../data/scenes'
import { Hex, Rich } from './Hex'

const lineWord = (l: number) => (l === 1 ? '阳' : '阴')

function TriRow({ t, role }: { t: Trigram; role: string }) {
  return (
    <div className="gb-tri">
      <div className="gb-tri-fig"><Hex lines={t.lines} size={40} /><b>{t.name}</b></div>
      <div>
        <div className="gb-tri-head">{role} · {t.name} {t.symbol} {t.nature} · {t.trait}</div>
        <div className="gb-tri-lines">从下往上：{t.lines.map(lineWord).join('、')}</div>
        <p>{TRIGRAM_WHY[t.name]}</p>
      </div>
    </div>
  )
}

/** 每一卦开头的基础回顾：只讲看懂这一卦必需的几件事，都由本卦的卦画推出 */
export function GuaBasics({ n, open, freeLinks }: { n: number; open?: boolean; freeLinks?: boolean }) {
  const h = HEXAGRAMS[n - 1]
  const yang = h.lines.filter((l) => l === 1).length
  const lo = h.lower, up = h.upper
  const pure = lo.name === up.name
  const link = (day: number) => (freeLinks ? `#/free/${day}` : `#/lesson/${day}`)
  return (
    <details className="gua-basics" open={open}>
      <summary>
        <span className="gb-k">基</span>
        <span className="gb-sum">看懂这一卦需要的基础<small>零基础先点开，约 2 分钟</small></span>
      </summary>

      <section>
        <h4><i>一</i>阴爻与阳爻</h4>
        <div className="gb-yy">
          <div><Hex lines={[1]} size={44} /><span>阳爻 · 实线</span></div>
          <div><Hex lines={[0]} size={44} /><span>阴爻 · 断线</span></div>
        </div>
        <Rich text={`**实线是阳**：连成一片、充实——刚、动、主动。\n**断线是阴**：中间空着、能容纳——柔、静、承接。\n\n为什么这样画：古人以奇数为阳、偶数为阴，一整条是“一”，断成两段是“二”；实为阳、虚为阴。阴阳只是两种性质，**不分好坏**。\n\n${h.name}卦：${yang} 条阳爻、${6 - yang} 条阴爻。`} />
      </section>

      <section>
        <h4><i>二</i>六条爻，从下往上读</h4>
        <div className="gb-six">
          <Hex lines={h.lines} size={64} labels />
          <div className="gb-groups">
            {[{ cap: `上卦 · 外 · ${up.name}`, idx: [5, 4, 3] }, { cap: `下卦 · 内 · ${lo.name}`, idx: [2, 1, 0] }].map((g) => (
              <div key={g.cap} className="gb-grp">
                <div className="gb-cap">{g.cap}</div>
                <ol>
                  {g.idx.map((i) => (
                    <li key={i}><b>{yaoTitle(i, h.lines[i])}</b><span>第 {i + 1} 条 · {lineWord(h.lines[i])}</span></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
        <Rich text={`第一条在**最下面**，叫“初”；往上是二、三、四、五，最上面叫“上”。\n为什么从下往上：草木从地里往上长，房子从地基往上盖——古人认为变化**从下面开始**（《易纬》：“易气从下生”）。\n\n下面三条 = **下卦 = 内卦**：自己、内部、事情的开始。\n上面三条 = **上卦 = 外卦**：外界、环境、对方、后来。\n理由同上：先有的在下、在里面；后来的在上、在外面。\n\n爻名里“九”指阳、“六”指阴（为什么是九和六，古人有两种说法）。`} />
      </section>

      <section>
        <h4><i>三</i>这一卦的两个三爻卦</h4>
        <TriRow t={up} role="上卦 · 外" />
        <TriRow t={lo} role="下卦 · 内" />
        <Rich text={pure
          ? `上下都是${lo.name}：同一个象叠了两层，意思加倍。全名“${h.fullName}”。`
          : `合起来：**内（自己）是${lo.nature}·${lo.trait}，外（环境）是${up.nature}·${up.trait}**。先自己想想这是什么局面，再往下看推导。\n全名“${h.fullName}”：先读上卦的象（${up.nature}），再读下卦的象（${lo.nature}），最后是卦名。`} />
        <p className="gb-note"><span className="tag tag-约定">约定</span>八卦为什么配这些自然物，上面的“线形读法”是帮助理解的解释，多来自《说卦传》和历代注家：古人先有八卦配八物，后人再讲为什么。当作有道理的记忆钩子，不是定理。</p>
      </section>

      <div className="gb-links">
        <span>想看完整推导：</span>
        <a href={link(4)}>爻（第 4 天）</a>
        <a href={link(5)}>从下往上（第 5 天）</a>
        <a href={link(6)}>三爻成八卦（第 6 天）</a>
        <a href={link(16)}>内卦外卦（第 16 天）</a>
        <a href={link(19)}>初九六二（第 19 天）</a>
      </div>
    </details>
  )
}
