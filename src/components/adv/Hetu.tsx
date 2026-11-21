const DOTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-8, 0], [8, 0]],
  3: [[0, -8], [-8, 7], [8, 7]],
  4: [[-7, -7], [7, -7], [-7, 7], [7, 7]],
  5: [[0, 0], [-9, -9], [9, -9], [-9, 9], [9, 9]],
  6: [[-8, -10], [8, -10], [-8, 0], [8, 0], [-8, 10], [8, 10]],
  7: [[0, 0], [-10, -8], [0, -8], [10, -8], [-10, 8], [0, 8], [10, 8]],
  8: [[-8, -12], [8, -12], [-8, -4], [8, -4], [-8, 4], [8, 4], [-8, 12], [8, 12]],
  9: [[-9, -9], [0, -9], [9, -9], [-9, 0], [0, 0], [9, 0], [-9, 9], [0, 9], [9, 9]],
  10: [[-6, -16], [6, -16], [-6, -8], [6, -8], [-6, 0], [6, 0], [-6, 8], [6, 8], [-6, 16], [6, 16]],
}

function Cluster({ n, sky, x, y }: { n: number; sky: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {DOTS[n].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r="3.3" className={sky ? 'sky' : 'earth'} />)}
    </g>
  )
}

export default function Hetu() {
  return (
    <div className="adv" data-widget="hetu">
      <svg viewBox="0 0 280 320" className="diagram">
        <text x="140" y="18" textAnchor="middle" className="diag-dir">南 · 火</text>
        <Cluster n={2} sky={false} x={140} y={40} />
        <Cluster n={7} sky x={140} y={68} />
        <text x="18" y="168" className="diag-dir">东</text>
        <text x="18" y="184" className="diag-dir">木</text>
        <Cluster n={3} sky x={62} y={150} />
        <Cluster n={8} sky={false} x={62} y={186} />
        <text x="140" y="128" textAnchor="middle" className="diag-dir">中 · 土</text>
        <Cluster n={5} sky x={140} y={156} />
        <Cluster n={10} sky={false} x={140} y={196} />
        <text x="262" y="168" textAnchor="end" className="diag-dir">西</text>
        <text x="262" y="184" textAnchor="end" className="diag-dir">金</text>
        <Cluster n={4} sky={false} x={218} y={150} />
        <Cluster n={9} sky x={218} y={186} />
        <Cluster n={1} sky x={140} y={250} />
        <Cluster n={6} sky={false} x={140} y={278} />
        <text x="140" y="312" textAnchor="middle" className="diag-dir">北 · 水</text>
      </svg>
      <p className="hint">白点是天数（奇数，生数），黑点是地数（偶数，成数）。下北 1 与 6 为水，上南 2 与 7 为火，左东 3 与 8 为木，右西 4 与 9 为金，中央 5 与 10 为土。方位按上南下北、左东右西。</p>
    </div>
  )
}
