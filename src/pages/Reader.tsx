import { useState } from 'react'
import { HEXAGRAMS, yaoTitle } from '../data/bagua'
import { Hex } from '../components/Hex'
import { SHUOGUA, TUAN, WENYAN, XICI_SHANG, XICI_XIA, XIANG_DA, XIANG_XIAO, XUGUA, ZAGUA } from '../data/yizhuan'

const BOOKS = [
  { id: 'gua', name: '经·六十四卦', desc: '卦辞、爻辞，对照彖传与象传' },
  { id: 'wenyan', name: '文言', desc: '乾、坤二卦' },
  { id: 'xici1', name: '系辞上', desc: '十二章 · 朱熹《本义》' },
  { id: 'xici2', name: '系辞下', desc: '十二章 · 朱熹《本义》' },
  { id: 'shuogua', name: '说卦', desc: '十一章' },
  { id: 'xugua', name: '序卦', desc: '上篇、下篇' },
  { id: 'zagua', name: '杂卦', desc: '一篇' },
] as const

type BookId = (typeof BOOKS)[number]['id']

const isBook = (s?: string): s is BookId => BOOKS.some((b) => b.id === s)
const bookOf = (id: BookId) => BOOKS.find((b) => b.id === id)!

function countOf(book: BookId) {
  if (book === 'gua') return 64
  if (book === 'wenyan' || book === 'xugua') return 2
  if (book === 'xici1' || book === 'xici2') return 12
  if (book === 'shuogua') return 11
  return 1
}

function titleOf(book: BookId, n: number) {
  if (book === 'gua') return HEXAGRAMS[n - 1].name
  if (book === 'wenyan') return n === 1 ? '乾文言' : '坤文言'
  if (book === 'xugua') return n === 1 ? '上篇' : '下篇'
  if (book === 'zagua') return '一篇'
  return `第 ${n} 章`
}

function parasOf(book: BookId, n: number): string[] {
  if (book === 'wenyan') return n === 1 ? WENYAN.qian : WENYAN.kun
  if (book === 'xici1') return XICI_SHANG[n - 1] ?? []
  if (book === 'xici2') return XICI_XIA[n - 1] ?? []
  if (book === 'shuogua') return SHUOGUA[n - 1] ?? []
  if (book === 'xugua') return n === 1 ? XUGUA.shang : XUGUA.xia
  if (book === 'zagua') return ZAGUA
  return []
}

function useJingOnly(): [boolean, (v: boolean) => void] {
  const [jing, setJing] = useState(() => {
    try { return sessionStorage.getItem('yixue-reader') === 'jing' } catch { return false }
  })
  const set = (v: boolean) => {
    setJing(v)
    try { sessionStorage.setItem('yixue-reader', v ? 'jing' : 'he') } catch { /* 无存储时只记在这一页 */ }
  }
  return [jing, set]
}

function Head({ back, kicker, title }: { back: string; kicker: string; title: string }) {
  return (
    <header className="lesson-head">
      <a href={back} className="back" aria-label="返回">‹</a>
      <div className="lh-mid"><div className="lh-day">{kicker}</div><div className="lh-title">{title}</div></div>
    </header>
  )
}

function Bai({ text }: { text?: string }) {
  if (!text) return null
  return (
    <details className="bai-fold">
      <summary>白话</summary>
      <p className="bai">{text}</p>
    </details>
  )
}

function StepNav({ book, n }: { book: BookId; n: number }) {
  const total = countOf(book)
  const prev = n > 1 ? n - 1 : 0
  const next = n < total ? n + 1 : 0
  const href = (i: number) => `#/reader/${book}/${i}`
  return (
    <div className="nav-btns">
      {prev ? <a className="btn ghost" href={href(prev)}>‹ {titleOf(book, prev)}</a> : <span className="btn ghost is-off">‹</span>}
      {next ? <a className="btn ghost" href={href(next)}>{titleOf(book, next)} ›</a> : <span className="btn ghost is-off">›</span>}
    </div>
  )
}

function BookList() {
  return (
    <div className="page">
      <Head back="#/atlas" kicker="工具" title="原文对照" />
      <p className="muted">通行本经传，简体排印。点开一部，从经文读到十翼。</p>
      <nav className="reader-list" aria-label="书目">
        {BOOKS.map((b) => (
          <a key={b.id} className="reader-book" href={b.id === 'zagua' ? '#/reader/zagua/1' : `#/reader/${b.id}`}>
            <span><b>{b.name}</b><span>{b.desc}</span></span>
            <span className="go" aria-hidden>›</span>
          </a>
        ))}
      </nav>
      <p className="source-note">系辞分章依朱熹《周易本义》。文言只系于乾、坤。</p>
    </div>
  )
}

function Toc({ book }: { book: BookId }) {
  const meta = bookOf(book)
  const total = countOf(book)
  if (book === 'gua') {
    return (
      <div className="page">
        <Head back="#/reader" kicker="原文对照" title={meta.name} />
        <div className="gua-mini">
          {HEXAGRAMS.map((h) => (
            <a key={h.n} href={`#/reader/gua/${h.n}`}><span className="n">{h.n}</span>{h.name}</a>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="page">
      <Head back="#/reader" kicker="原文对照" title={meta.name} />
      <nav className="card ch-list">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1
          const lead = parasOf(book, n)[0] ?? ''
          const preview = lead.length > 22 ? lead.slice(0, 22) + '…' : lead
          return (
            <a key={n} href={`#/reader/${book}/${n}`}>
              <b>{titleOf(book, n)}</b>
              <span>{preview}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}

function GuaView({ n }: { n: number }) {
  const h = HEXAGRAMS[n - 1]
  const [jing, setJing] = useJingOnly()
  const he = !jing
  const wen = n === 1 ? WENYAN.qian : n === 2 ? WENYAN.kun : null
  return (
    <div className="page">
      <Head back="#/reader/gua" kicker={`第 ${h.n} 卦 · ${h.n <= 30 ? '上经' : '下经'}`} title={h.fullName} />
      <div className="rd-toggle" role="group" aria-label="显示">
        <button type="button" className={he ? 'on' : ''} onClick={() => setJing(false)}>经传合编</button>
        <button type="button" className={jing ? 'on' : ''} onClick={() => setJing(true)}>只看经文</button>
      </div>
      <section className="card rd-reading">
        <div className="rd-gua-top">
          <Hex lines={h.lines} size={78} />
          <div>
            <div className="rd-gua-name">{h.name}</div>
            <div className="muted">{h.gist}</div>
          </div>
        </div>

        <div className="rd-block">
          <div className="rd-kicker">卦辞</div>
          <p className="classic">{h.guaci}</p>
          <Bai text={h.gcBai} />
          {he && (
            <>
              <div className="rd-kicker">彖</div>
              <p className="rd-zhuan">{TUAN[n - 1]}</p>
              <div className="rd-kicker">大象</div>
              <p className="rd-zhuan">{XIANG_DA[n - 1]}</p>
            </>
          )}
        </div>

        {h.yao.map((y, i) => {
          const yong = i === 6
          const label = yong ? (h.n === 1 ? '用九' : '用六') : yaoTitle(i, h.lines[i])
          return (
            <div className="rd-block" key={label}>
              <div className="yi-head">
                {!yong && <Hex lines={[h.lines[i]]} size={28} />}
                <span className="yi-t">{label}</span>
              </div>
              <p className="classic">{y}</p>
              <Bai text={h.yaoBai[i]} />
              {he && <p className="rd-zhuan"><b>小象</b>{XIANG_XIAO[n - 1][i]}</p>}
            </div>
          )
        })}

        {he && wen && (
          <div className="rd-block">
            <div className="rd-kicker">{h.name}·文言</div>
            {wen.map((p, i) => <p className="rd-zhuan" key={i}>{p}</p>)}
          </div>
        )}
      </section>
      <StepNav book="gua" n={n} />
    </div>
  )
}

function ChapterView({ book, n }: { book: BookId; n: number }) {
  const paras = parasOf(book, n)
  const meta = bookOf(book)
  return (
    <div className="page">
      <Head back={book === 'zagua' ? '#/reader' : `#/reader/${book}`} kicker={meta.name} title={titleOf(book, n)} />
      <section className="card rd-reading">
        {paras.map((p, i) => <p className="classic" key={i}>{p}</p>)}
      </section>
      {book !== 'zagua' && <StepNav book={book} n={n} />}
      <p className="source-note">通行本，简体。{book === 'xici1' || book === 'xici2' ? '分章依朱熹《周易本义》。' : ''}</p>
    </div>
  )
}

function Missing({ book }: { book: BookId }) {
  return (
    <div className="page">
      <Head back={`#/reader/${book}`} kicker={bookOf(book).name} title="没有这一篇" />
      <p className="muted">回到目录另选一篇。</p>
    </div>
  )
}

export function ReaderPage({ book, index }: { book?: string; index?: string }) {
  if (!isBook(book)) return <BookList />
  if (book === 'zagua') return <ChapterView book="zagua" n={1} />
  if (!index) return <Toc book={book} />
  const n = Number(index)
  if (!Number.isInteger(n) || n < 1 || n > countOf(book)) return <Missing book={book} />
  if (book === 'gua') return <GuaView n={n} />
  return <ChapterView book={book} n={n} />
}
