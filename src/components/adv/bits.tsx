export function WhyBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="adv-why">
      <b>{title}</b>
      <p>{text}</p>
    </div>
  )
}

/** 字面是「周易通宝」，背面是月牙和星。和课里的铜钱是同一枚。 */
export function CoinFace({ side }: { side: '字' | '背' }) {
  return (
    <svg viewBox="-50 -50 100 100" className={`coin-face ${side === '字' ? 'yang' : 'yin'}`}>
      <circle r="47" className="cf-rim" />
      <circle r="40" className="cf-field" />
      <rect x="-11" y="-11" width="22" height="22" className="cf-hole" />
      {side === '字' ? (
        <g className="cf-txt">
          <text y="-20">周</text><text y="34">易</text><text x="27" y="7">通</text><text x="-27" y="7">宝</text>
        </g>
      ) : (
        <g className="cf-mark">
          <path d="M-6 -30 a12 12 0 1 0 12 0 a9 9 0 1 1 -12 0z" />
          <circle cy="27" r="3.2" />
        </g>
      )}
    </svg>
  )
}

export function YaoMark({ yang, hot }: { yang: boolean; hot?: boolean }) {
  const fill = hot ? 'var(--cinnabar)' : 'var(--ink)'
  return (
    <svg className="yao-mark" viewBox="0 0 28 8" width="28" height="8" aria-hidden>
      {yang
        ? <rect width="28" height="8" rx="1.5" fill={fill} />
        : <><rect width="12" height="8" rx="1.5" fill={fill} /><rect x="16" width="12" height="8" rx="1.5" fill={fill} /></>}
    </svg>
  )
}
