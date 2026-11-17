import { ELECTIVES, ELECTIVE_UNITS, LESSONS, UNITS, lessonLabel, type Lesson, type Screen, type WidgetName } from '../data/curriculum'
import { HEXAGRAMS } from '../data/bagua'
import { Rich } from '../components/Hex'

const WIDGET_NOTE: Record<WidgetName, string> = {
  yinyangSort: '【互动】阴阳分类小练习（见应用）',
  taiji: '【图】太极图：阴中有阳、阳中有阴（见应用）',
  yaoBrush: '【互动】一笔写出阳爻/阴爻，点击切换（见应用）',
  sixiangScene: '【互动】两根线叠成四象，对照四季（见应用）',
  trigramScene: '【互动】三根线叠成八卦，看它化成哪种自然景象（见应用）',
  taipi: '【动画】泰与否：天地之气交与不交（见应用）',
  coin3: '【互动】掷硬币三次得一个八卦（见应用）',
  coin6: '【互动】掷硬币六次得一个六十四卦（见应用）',
  lookup: '【表】上下卦查卦表（见应用）',
  trigramCards: '【互动】八卦翻卡（见应用）',
  trigramExplorer: '【互动】八卦资料总表（见应用）',
  xiantianMap: '【图】先天八卦方位图（见应用）',
  houtianMap: '【图】后天八卦方位图（见应用）',
  wuxingCycle: '【图】五行生克图（见应用）',
  hexBuilder: '【互动】拼卦：选上卦下卦（见应用）',
  yaoPosition: '【互动】爻位、当位、居中、相应（见应用）',
  huBian: '【互动】互卦变卦演示（见应用）',
  meihuaNumber: '【互动】数字起卦练习（见应用）',
}

function screenMd(s: Screen): string {
  if (s.t === 'text') return `### ${s.tag ? `【${s.tag}】` : ''}${s.title}\n\n${s.body.replace(/\n/g, '  \n')}\n`
  if (s.t === 'widget') return `### ${s.title}\n\n${s.body ? s.body + '\n\n' : ''}${WIDGET_NOTE[s.w]}\n`
  const h = HEXAGRAMS[s.n - 1]
  return `### ${s.title}\n\n**${h.name}**（${h.fullName}）：${h.gist}\n\n> ${h.guaci}\n\n白话：${h.gcBai}\n\n${h.yao.map((y, i) => `- ${y}　——${h.yaoBai[i]}`).join('\n')}\n`
}

export function lessonMd(l: Lesson) {
  return [
    `## ${lessonLabel(l)} · ${l.title}`,
    `*${l.subtitle}*\n\n学习目标：${l.goal}（约 ${l.minutes} 分钟）\n`,
    ...l.screens.map(screenMd),
    `### 练习`,
    ...l.quiz.map((q, i) => `${i + 1}. ${q.q}\n${q.opts.map((o, k) => `   ${'ABCDEF'[k]}. ${o}`).join('\n')}`),
    `\n<details><summary>答案</summary>\n\n${l.quiz.map((q, i) => `${i + 1}. ${'ABCDEF'[q.a]}　${q.ex}`).join('\n')}\n\n</details>\n`,
  ].join('\n')
}

export function allMd() {
  return `# 周易 · 梅花易数入门 每日讲义\n\n` + [...UNITS, ...ELECTIVE_UNITS].map((u) => `# ${u.name}\n\n${u.desc}\n\n` + [...LESSONS, ...ELECTIVES].filter((l) => l.unit === u.id).map(lessonMd).join('\n---\n\n')).join('\n')
}

const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function HandoutPage() {
  return (
    <div className="page handout">
      <header className="lesson-head no-print">
        <a href="#/course" className="back">‹</a>
        <div className="lh-mid"><div className="lh-day">主线 {LESSONS.length} 天 · 选修 {ELECTIVES.length} 课</div><div className="lh-title">每日讲义</div></div>
      </header>
      <div className="row no-print">
        <button className="btn primary grow" onClick={() => download('周易入门-每日讲义.md', allMd())}>下载全部（Markdown）</button>
        <button className="btn ghost grow" onClick={() => window.print()}>打印 / 存为 PDF</button>
      </div>
      {[...LESSONS, ...ELECTIVES].map((l) => (
        <article key={l.day} className="card ho-day">
          <div className="ho-head">
            <h2>{lessonLabel(l)} · {l.title}</h2>
            <button className="btn ghost sm no-print" onClick={() => download(`${lessonLabel(l).replace(/\s/g, '')}-${l.title}.md`, lessonMd(l))}>下载本天</button>
          </div>
          <div className="muted">🎯 {l.goal} · 约 {l.minutes} 分钟</div>
          {l.screens.map((s, i) => (
            <div key={i} className="ho-sec">
              <h4>{s.title}</h4>
              {s.t === 'text' && <Rich text={s.body} />}
              {s.t === 'widget' && <p className="muted">{s.body ? s.body + ' ' : ''}{WIDGET_NOTE[s.w]}</p>}
              {s.t === 'hex' && (() => { const h = HEXAGRAMS[s.n - 1]; return <><p className="classic">{h.guaci}</p><p className="bai">{h.gcBai}</p></> })()}
            </div>
          ))}
          <h4>练习</h4>
          <ol className="ho-quiz">
            {l.quiz.map((q, i) => <li key={i}>{q.q}（{q.opts.join(' / ')}）<span className="muted"> 答案：{q.opts[q.a]}</span></li>)}
          </ol>
        </article>
      ))}
    </div>
  )
}
