export function ReaderPage({ book, index }: { book?: string; index?: string }) {
  const where = [book, index].filter(Boolean).join(' · ')
  return (
    <div className="page">
      <header className="lesson-head">
        <a href="#/atlas" className="back" aria-label="返回">‹</a>
        <div className="lh-mid"><div className="lh-day">工具</div><div className="lh-title">原文对照</div></div>
      </header>
      <section className="card soon-card">
        <h2>即将上线</h2>
        <p className="muted">经传对照阅读还在制作。{where ? `（${where}）` : ''}</p>
      </section>
    </div>
  )
}
