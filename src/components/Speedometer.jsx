import { useEffect, useMemo, useRef } from 'react';

/* Slim, clean semi-circle compliance gauge, 0-100.
   180deg (left, value 0) -> 360deg (right, value 100), over the top. */
const CX = 260, CY = 292;
const R_OUT = 200, R_IN = 136;
const R_RING = 214, R_NUM = 238;
const MIN = 0, MAX = 100;
const GAP = 3; // white divider between bands (degrees)

const BANDS = [
  { name: 'POOR',      color: '#e03131', from: 0,  to: 20, pillBg: '#fee2e2', pillTx: '#b91c1c' },
  { name: 'FAIR',      color: '#fb8c00', from: 20, to: 40, pillBg: '#ffedd5', pillTx: '#c2410c' },
  { name: 'GOOD',      color: '#ffcf00', from: 40, to: 60, pillBg: '#fef9c3', pillTx: '#a16207' },
  { name: 'VERY GOOD', color: '#7cb342', from: 60, to: 80, pillBg: '#ecfccb', pillTx: '#4d7c0f' },
  { name: 'EXCELLENT', color: '#2e7d32', from: 80, to: 100, pillBg: '#dcfce7', pillTx: '#15803d' },
];

const rad = (d) => (d * Math.PI) / 180;
const P = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const f = (n) => +n.toFixed(2);

/* annular sector for value range [v0,v1] with white divider gaps */
function sector(v0, v1) {
  const a0 = 180 + (v0 / 100) * 180 + GAP / 2;
  const a1 = 180 + (v1 / 100) * 180 - GAP / 2;
  const [x0, y0] = P(R_OUT, a0);
  const [x1, y1] = P(R_OUT, a1);
  const [x2, y2] = P(R_IN, a1);
  const [x3, y3] = P(R_IN, a0);
  return `M ${f(x0)} ${f(y0)} A ${R_OUT} ${R_OUT} 0 0 1 ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} A ${R_IN} ${R_IN} 0 0 0 ${f(x3)} ${f(y3)} Z`;
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function Speedometer({ value = 76, duration = 1800, onDone }) {
  const target = Math.max(MIN, Math.min(MAX, value));
  const activeIdx = BANDS.findIndex((b) => target < b.to || b.to === 100);
  const band = BANDS[activeIdx === -1 ? 0 : activeIdx];

  const needleRef = useRef(null);
  const numRef = useRef(null);
  const currentRef = useRef(0); // animated value, NOT state -> zero glitch
  const rafRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const ringD = useMemo(() => {
    const [x0, y0] = P(R_RING, 180);
    const [x1, y1] = P(R_RING, 360);
    return `M ${f(x0)} ${f(y0)} A ${R_RING} ${R_RING} 0 0 1 ${f(x1)} ${f(y1)}`;
  }, []);

  const ticks = useMemo(() => {
    const arr = [];
    for (let v = MIN; v <= MAX; v += 5) {
      const deg = 180 + (v / 100) * 180;
      const major = v % 10 === 0;
      const [x1, y1] = P(major ? R_RING - 11 : R_RING - 6, deg);
      const [x2, y2] = P(R_RING, deg);
      arr.push({ v, x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), major });
    }
    return arr;
  }, []);

  const numbers = useMemo(() => {
    const arr = [];
    for (let v = MIN; v <= MAX; v += 10) {
      const deg = 180 + (v / 100) * 180;
      const [x, y] = P(R_NUM, deg);
      arr.push({ v, x: f(x), y: f(y) });
    }
    return arr;
  }, []);

  // direct DOM paint per frame — no React re-render
  const paint = (v) => {
    const frac = (v - MIN) / (MAX - MIN);
    if (needleRef.current) {
      needleRef.current.setAttribute('transform', `rotate(${(frac * 180).toFixed(3)} ${CX} ${CY})`);
    }
    if (numRef.current) {
      numRef.current.textContent = String(Math.round(v));
    }
  };

  useEffect(() => {
    const from = currentRef.current;
    const to = target;
    if (from === to) {
      paint(to);
      return;
    }
    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = from + (to - from) * easeOutExpo(p);
      currentRef.current = v;
      paint(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        currentRef.current = to;
        paint(to);
        doneRef.current && doneRef.current(to);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return (
    <div className="speedo">
      <svg viewBox="0 0 520 344" className="speedo-svg" role="img" aria-label={`Compliance score ${target} out of 100, ${band.name}`}>
        <defs>
          <filter id="needleShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* outer thin ring + ticks */}
        <path d={ringD} fill="none" stroke="#94a3b8" strokeWidth="2" />
        {ticks.map((t) => (
          <line
            key={t.v}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? '#475569' : '#cbd5e1'}
            strokeWidth={t.major ? 2.5 : 2}
            strokeLinecap="round"
          />
        ))}

        {/* 0-100 numerals */}
        {numbers.map((n) => (
          <text key={n.v} x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" className="g-num">
            {n.v}
          </text>
        ))}

        {/* slim color bands */}
        {BANDS.map((b, i) => (
          <path
            key={b.name}
            d={sector(b.from, b.to)}
            fill={b.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="seg"
            opacity={i === activeIdx ? 1 : 0.35}
          />
        ))}

        {/* score readout in the middle */}
        <text x={CX} y={232} textAnchor="middle" className="score-num">
          <tspan ref={numRef}>0</tspan>
        </text>
        <text x={CX} y={260} textAnchor="middle" className="score-unit">/ 100</text>

        {/* slim needle (drawn pointing left = value 0, rotated per frame) */}
        <g ref={needleRef} transform={`rotate(0 ${CX} ${CY})`} filter="url(#needleShadow)">
          <polygon points={`104,292 252,286.5 252,297.5`} fill="#0f172a" />
          <polygon points={`268,288 268,296 286,292`} fill="#0f172a" />
        </g>
        <circle cx={CX} cy={CY} r="14" fill="#0f172a" />
        <circle cx={CX} cy={CY} r="9" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="4" fill="#0f172a" />
      </svg>

      <div className="speedo-rating" style={{ background: band.pillBg, borderColor: band.pillBg, color: band.pillTx }}>
        {band.name} • {target}/100
      </div>
    </div>
  );
}
