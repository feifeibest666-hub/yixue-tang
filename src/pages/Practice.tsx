import { useMemo, useState } from 'react'
import { ALL_CARDS, cardById, seededShuffle, type StudyCard } from '../data/cards'
import { clearWrong, dueCards, reviewCard, todayStr, useStore, wrongCards, getState } from '../lib/store'
import { Hex } from '../components/Hex'
import { lessonByDay, lessonLabel } from '../data/curriculum'

type Deck = 'bagua' | 'gua64'
const DECK_NAME: Record<Deck, string> = { bagua: '八卦', gua64: '六十四卦' }

function newCards(deck: Deck, n: number) {
  const s = getState()
  return ALL_CARDS.filter((c) => c.deck === deck && !s.cards[c.id]).slice(0, n).map((c) => c.id)
}

export function PracticePage({ mode }: { mode?: string }) {
  const s = useStore()
  const [session, setSession] = useState<{ ids: string[]; style: 'quiz' | 'flash'; title: string } | null>(() => {
    if (mode === 'review') {
      const due = dueCards(getState())
      return { ids: due.length ? due.slice(0, 30) : newCards('bagua', 10), style: 'quiz', title: due.length ? '到期复习' : '新卡片 · 八卦' }
    }
    return null
  })
  const due = dueCards(s)
  const wrong = wrongCards(s)
  const lessonWrong = Object.entries(s.wrong)

  if (session) return <Session {...session} onExit={() => { setSession(null); window.location.hash = '#/practice' }} />

  const deckStats = (d: Deck) => {
    const all = ALL_CARDS.filter((c) => c.deck === d)
    const seen = all.filter((c) => s.cards[c.id])
    const mastered = seen.filter((c) => s.cards[c.id].box >= 4)
    return { total: all.length, seen: seen.length, mastered: mastered.length }
  }

  if (mode === 'wrong') return <WrongBook />

  return (
    <div className="page">
      <header className="page-head"><div><div className="eyebrow">温习</div><h1>记忆练习</h1></div></header>
      <p className="muted">卡片按遗忘规律安排：记住的隔几天再来，忘了的明天再见。</p>
      <section className="card hl">
        <h3>今日复习</h3>
        <p>{due.length > 0 ? `有 ${due.length} 张卡片到期，复习一下吧。` : '没有到期卡片。可以学点新卡片。'}</p>
        <div className="row">
          <button className="btn primary" disabled={!due.length} onClick={() => setSession({ ids: due.slice(0, 30), style: 'quiz', title: '到期复习 · 测验' })}>测验复习</button>
          <button className="btn ghost" disabled={!due.length} onClick={() => setSession({ ids: due.slice(0, 30), style: 'flash', title: '到期复习 · 闪卡' })}>闪卡复习</button>
        </div>
      </section>

      {(['bagua', 'gua64'] as Deck[]).map((d) => {
        const st = deckStats(d)
        return (
          <section key={d} className="card">
            <h3>{DECK_NAME[d]}卡组</h3>
            <div className="deck-bar"><div style={{ width: `${(st.seen / st.total) * 100}%` }} /><div className="m" style={{ width: `${(st.mastered / st.total) * 100}%` }} /></div>
            <div className="muted">共 {st.total} 张 · 已学 {st.seen} · 熟练 {st.mastered}</div>
            <div className="row mt">
              <button className="btn primary" disabled={st.seen >= st.total} onClick={() => setSession({ ids: newCards(d, 10), style: 'quiz', title: `新卡片 · ${DECK_NAME[d]}` })}>学 10 张新卡</button>
              <button className="btn ghost" onClick={() => setSession({ ids: seededShuffle(ALL_CARDS.filter((c) => c.deck === d).map((c) => c.id), String(Date.now())).slice(0, 15), style: 'flash', title: `随机闪卡 · ${DECK_NAME[d]}` })}>随机闪卡 15 张</button>
            </div>
          </section>
        )
      })}

      <section className="card">
        <h3>错题本</h3>
        <p>卡片错题 {wrong.length} 道 · 课程练习错题 {lessonWrong.length} 道</p>
        <div className="row">
          <button className="btn primary" disabled={!wrong.length} onClick={() => setSession({ ids: wrong, style: 'quiz', title: '错题复习' })}>复习卡片错题</button>
          <a className="btn ghost" href="#/practice/wrong">查看课程错题</a>
        </div>
      </section>

      <p className="source-note">间隔重复：答对后间隔 1、2、4、7、15、30 天再出现；答错当天重来。</p>
    </div>
  )
}

function Session({ ids, style, title, onExit }: { ids: string[]; style: 'quiz' | 'flash'; title: string; onExit: () => void }) {
  const [queue, setQueue] = useState(ids)
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [right, setRight] = useState(0)
  const card: StudyCard | undefined = cardById(queue[i])
  const opts = useMemo(() => (card ? seededShuffle(card.options, card.id + i) : []), [card, i])

  if (!card || i >= queue.length)
    return (
      <div className="page">
        <div className="card center">
          <div className="result-ring">{right}/{ids.length}</div>
          <h2>{ids.length === 0 ? '没有需要练习的卡片' : '本轮完成！'}</h2>
          <button className="btn primary block" onClick={onExit}>返回</button>
        </div>
      </div>
    )

  const grade = (ok: boolean) => {
    reviewCard(card.id, ok)
    if (ok) setRight(right + 1)
    else if (queue.filter((x) => x === card.id).length < 2) setQueue([...queue, card.id])
  }
  const next = () => { setI(i + 1); setChosen(null); setFlipped(false) }

  return (
    <div className="page">
      <header className="lesson-head">
        <button className="back" onClick={onExit}>‹</button>
        <div className="lh-mid"><div className="lh-day">{title}</div><div className="lh-title">{i + 1} / {queue.length}</div></div>
      </header>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => style === 'flash' && !flipped && setFlipped(true)}>
        {card.lines && <Hex lines={card.lines} size={card.lines.length === 3 ? 110 : 90} />}
        <div className="fc-prompt">{card.prompt}</div>
        {style === 'flash' && (flipped ? <div className="fc-ans">{card.answer}{card.note && <small>{card.note}</small>}</div> : <div className="hint">点卡片翻面</div>)}
      </div>
      {style === 'quiz' && (
        <>
          <div className="opts grid2">
            {opts.map((o) => (
              <button key={o} className={`opt ${chosen ? (o === card.answer ? 'right' : o === chosen ? 'wrong' : 'dim') : ''}`}
                onClick={() => { if (chosen) return; setChosen(o); grade(o === card.answer) }}>{o}</button>
            ))}
          </div>
          {chosen && (
            <>
              {card.note && <div className={`explain ${chosen === card.answer ? 'ok' : 'bad'}`}>{chosen === card.answer ? '✓ ' : `✗ 正确答案：${card.answer}。`}{card.note}</div>}
              <button className="btn primary block" onClick={next}>下一张</button>
            </>
          )}
        </>
      )}
      {style === 'flash' && flipped && (
        <div className="row">
          <button className="btn danger grow" onClick={() => { grade(false); next() }}>忘了</button>
          <button className="btn primary grow" onClick={() => { grade(true); next() }}>记得</button>
        </div>
      )}
    </div>
  )
}

function WrongBook() {
  const s = useStore()
  const items = Object.entries(s.wrong).sort((a, b) => b[1].count - a[1].count)
  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/practice" className="back">‹</a>
        <div className="lh-mid"><div className="lh-day">错题本</div><div className="lh-title">课程练习错题</div></div>
      </header>
      {items.length === 0 && <div className="card center">还没有错题，继续保持！</div>}
      {items.map(([k, w]) => {
        const q = lessonByDay(w.day)?.quiz[w.idx]
        if (!q) return null
        return (
          <div key={k} className="card">
            <div className="muted">{lessonByDay(w.day) ? lessonLabel(lessonByDay(w.day)!) : `第 ${w.day} 课`} · 错 {w.count} 次 · 最近 {w.last === todayStr() ? '今天' : w.last}</div>
            <p><b>{q.q}</b></p>
            <p>答案：<b className="ok-text">{q.opts[q.a]}</b></p>
            <p className="bai">{q.ex}</p>
            <div className="row">
              <a className="btn ghost sm" href={`#/lesson/${w.day}`}>回看本课</a>
              <button className="btn ghost sm" onClick={() => clearWrong(k)}>已掌握，移出</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
