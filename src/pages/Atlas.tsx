import { useState } from 'react'
import { HEXAGRAMS, TRIGRAMS, yaoTitle } from '../data/bagua'
import { Hex } from '../components/Hex'

export const PINYIN = 'qián kūn zhūn méng xū sòng shī bǐ xiǎo·xù lǚ tài pǐ tóng·rén dà·yǒu qiān yù suí gǔ lín guān shì·hé bì bō fù wú·wàng dà·xù yí dà·guò kǎn lí xián héng dùn dà·zhuàng jìn míng·yí jiā·rén kuí jiǎn xiè sǔn yì guài gòu cuì shēng kùn jǐng gé dǐng zhèn gèn jiàn guī·mèi fēng lǚ xùn duì huàn jié zhōng·fú xiǎo·guò jì·jì wèi·jì'
  .split(' ').map((p) => p.replace(/·/g, ' '))

export function AtlasPage() {
  const [q, setQ] = useState('')
  const [up, setUp] = useState('')
  const [lo, setLo] = useState('')
  const list = HEXAGRAMS.filter((h) =>
    (!q || h.name.includes(q) || h.fullName.includes(q) || String(h.n) === q || PINYIN[h.n - 1].replace(/[^a-z ]/gi, '').includes(q.toLowerCase())) &&
    (!up || h.upper.name === up) && (!lo || h.lower.name === lo))
  return (
    <div className="page">
      <header className="page-head"><h1>六十四卦图鉴</h1></header>
      <div className="filters card">
        <input placeholder="搜索卦名 / 序号，如：泰、11" value={q} onChange={(e) => setQ(e.target.value.trim())} />
        <div className="row">
          <select value={up} onChange={(e) => setUp(e.target.value)}>
            <option value="">上卦：全部</option>
            {TRIGRAMS.map((t) => <option key={t.name} value={t.name}>上卦：{t.name}（{t.nature}）</option>)}
          </select>
          <select value={lo} onChange={(e) => setLo(e.target.value)}>
            <option value="">下卦：全部</option>
            {TRIGRAMS.map((t) => <option key={t.name} value={t.name}>下卦：{t.name}（{t.nature}）</option>)}
          </select>
        </div>
      </div>
      <div className="atlas-grid">
        {list.map((h) => (
          <a key={h.n} href={`#/atlas/${h.n}`} className="atlas-cell">
            <span className="ac-n">{h.n}</span>
            <Hex lines={h.lines} size={42} />
            <span className="ac-name">{h.name}</span>
            <span className="ac-full">{h.fullName}</span>
          </a>
        ))}
      </div>
      {list.length === 0 && <p className="muted center">没有找到</p>}
      <p className="source-note">经文据通行本（王弼注本系统）整理，简体排印；白话为入门简释。</p>
    </div>
  )
}

export function GuaDetail({ n }: { n: number }) {
  const h = HEXAGRAMS[n - 1]
  if (!h) return <div className="page">没有这一卦。<a href="#/atlas">返回</a></div>
  const prev = HEXAGRAMS[(n + 62) % 64]
  const next = HEXAGRAMS[n % 64]
  return (
    <div className="page gua">
      <header className="lesson-head">
        <a href="#/atlas" className="back">‹</a>
        <div className="lh-mid"><div className="lh-day">第 {h.n} 卦 · {h.n <= 30 ? '上经' : '下经'}</div><div className="lh-title">{h.fullName}</div></div>
      </header>

      <section className="gua-hero card">
        <Hex lines={h.lines} size={110} labels />
        <div className="gh-right">
          <div className="gh-name">{h.name}</div>
          <div className="gh-py">{PINYIN[h.n - 1]}</div>
          <div className="gh-gist">{h.gist}</div>
          <div className="gh-tri">
            <span>上卦 <b>{h.upper.name}</b> {h.upper.symbol} {h.upper.nature}·{h.upper.wuxing}</span>
            <span>下卦 <b>{h.lower.name}</b> {h.lower.symbol} {h.lower.nature}·{h.lower.wuxing}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>卦辞</h3>
        <p className="classic">{h.guaci}</p>
        <p className="bai">{h.gcBai}</p>
        <h3 className="mt">大象</h3>
        <p className="classic">象曰：{h.xiang}</p>
      </section>

      <section className="card">
        <h3>爻辞</h3>
        {h.yao.map((y, i) => {
          const isYong = i === 6
          return (
            <div key={i} className="yao-item">
              <div className="yi-head">
                {!isYong && <Hex lines={[h.lines[i]]} size={28} />}
                <span className="yi-t">{isYong ? (h.n === 1 ? '用九' : '用六') : yaoTitle(i, h.lines[i])}</span>
              </div>
              <p className="classic">{y}</p>
              <p className="bai">{h.yaoBai[i]}</p>
            </div>
          )
        })}
      </section>

      <div className="nav-btns">
        <a className="btn ghost" href={`#/atlas/${prev.n}`}>‹ {prev.name}</a>
        <a className="btn ghost" href={`#/atlas/${next.n}`}>{next.name} ›</a>
      </div>
    </div>
  )
}
