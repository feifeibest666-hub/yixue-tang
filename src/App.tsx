import { useEffect, useState } from 'react'
import { TodayPage } from './pages/Today'
import { CoursePage, LessonPage } from './pages/Course'
import { AtlasPage, GuaDetail } from './pages/Atlas'
import { PracticePage } from './pages/Practice'
import { DivinePage, CasesPage, CaseDetail } from './pages/Divine'
import { HandoutPage } from './pages/Handout'

const useHash = () => {
  const [h, setH] = useState(() => window.location.hash.slice(1) || '/today')
  useEffect(() => {
    const f = () => { setH(window.location.hash.slice(1) || '/today'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

const TABS = [
  { to: '/today', label: '今日', icon: '日' },
  { to: '/course', label: '课程', icon: '学' },
  { to: '/atlas', label: '图鉴', icon: '卦' },
  { to: '/practice', label: '练习', icon: '习' },
  { to: '/divine', label: '起卦', icon: '占' },
]

export default function App() {
  const path = useHash()
  const parts = path.split('/').filter(Boolean)
  let page
  switch (parts[0]) {
    case 'course': page = <CoursePage />; break
    case 'lesson': page = <LessonPage day={Number(parts[1])} />; break
    case 'atlas': page = parts[1] ? <GuaDetail n={Number(parts[1])} /> : <AtlasPage />; break
    case 'practice': page = <PracticePage mode={parts[1]} />; break
    case 'divine': page = <DivinePage />; break
    case 'cases': page = <CasesPage />; break
    case 'case': page = <CaseDetail id={parts[1]} />; break
    case 'handout': page = <HandoutPage />; break
    default: page = <TodayPage />
  }
  const active = '/' + (parts[0] === 'lesson' ? 'course' : parts[0] === 'cases' || parts[0] === 'case' ? 'divine' : parts[0] || 'today')
  return (
    <div className="app">
      <main className="main" key={path}>{page}</main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <a key={t.to} href={`#${t.to}`} className={active === t.to ? 'on' : ''}>
            <span className="seal">{t.icon}</span>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
