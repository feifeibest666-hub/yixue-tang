import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { TodayPage } from './pages/Today'
import { CoursePage, LessonPage } from './pages/Course'
import { AtlasPage, GuaDetail } from './pages/Atlas'
import { PracticePage } from './pages/Practice'
import { DivinePage, CasesPage, CaseDetail } from './pages/Divine'
import { HandoutPage } from './pages/Handout'
import { WelcomePage } from './pages/Welcome'
import { GuaMapPage } from './pages/GuaMap'
import { guaLessonDay } from './data/curriculum'
import { isOnboarded, useStore } from './lib/store'

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
  { to: '/course', label: '学程', icon: '学' },
  { to: '/atlas', label: '卦典', icon: '卦' },
  { to: '/practice', label: '温习', icon: '习' },
  { to: '/divine', label: '起卦', icon: '占' },
]

export default function App() {
  const path = useHash()
  const s = useStore()
  const parts = path.split('/').filter(Boolean)
  const showWelcome = !isOnboarded(s) && (parts[0] === 'today' || !parts[0]) || parts[0] === 'welcome'
  let page
  if (showWelcome) page = <WelcomePage />
  else switch (parts[0]) {
    case 'course': page = <CoursePage />; break
    case 'lesson': page = <LessonPage day={Number(parts[1])} />; break
    case 'gua': page = parts[1] ? <LessonPage day={guaLessonDay(Number(parts[1]))} free /> : <GuaMapPage />; break
    case 'free': page = <LessonPage day={Number(parts[1])} free />; break
    case 'atlas': page = parts[1] ? <GuaDetail n={Number(parts[1])} /> : <AtlasPage />; break
    case 'practice': page = <PracticePage mode={parts[1]} />; break
    case 'divine': page = <DivinePage />; break
    case 'cases': page = <CasesPage />; break
    case 'case': page = <CaseDetail id={parts[1]} />; break
    case 'handout': page = <HandoutPage />; break
    default: page = <TodayPage />
  }
  const active = '/' + (parts[0] === 'lesson' ? 'course' : parts[0] === 'gua' || parts[0] === 'free' ? 'atlas' : parts[0] === 'cases' || parts[0] === 'case' ? 'divine' : parts[0] || 'today')
  const immersive = showWelcome || parts[0] === 'lesson' || parts[0] === 'free' || (parts[0] === 'gua' && Boolean(parts[1]))
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <filter id="ink-rough" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.11" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={showWelcome ? 'welcome' : path}
            className={`main ${immersive ? 'immersive' : ''}`}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.22, 0.7, 0.3, 1] }}
          >
            {page}
          </motion.main>
        </AnimatePresence>
        {!immersive && (
          <nav className="tabbar">
            {TABS.map((t) => (
              <a key={t.to} href={`#${t.to}`} className={active === t.to ? 'on' : ''}>
                <span className="seal">
                  {active === t.to && <motion.span layoutId="tab-ink" className="seal-ink" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                  <span className="seal-ch">{t.icon}</span>
                </span>
                <span className="tab-label">{t.label}</span>
              </a>
            ))}
          </nav>
        )}
      </div>
    </MotionConfig>
  )
}
