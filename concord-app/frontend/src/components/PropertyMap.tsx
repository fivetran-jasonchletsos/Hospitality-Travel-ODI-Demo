import { useMemo, useState } from 'react';
import { fmtCurrency } from '../api/data';

type Property = {
  property_id: string; name: string; brand: string;
  city: string; state: string; lat: number; lng: number;
  rooms: number; adr_usd: number; occupancy_pct: number; revpar_usd: number;
};

type Props = { properties: Property[]; colorBy: 'revpar' | 'occupancy' };

// Equirectangular projection for the continental US + Mexico/Caribbean.
// Bounds tuned to fit the portfolio footprint.
const BOUNDS = {
  lat: { min: 17, max: 50 },
  lng: { min: -125, max: -65 },
};

function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BOUNDS.lng.min) / (BOUNDS.lng.max - BOUNDS.lng.min)) * w;
  // Invert Y for screen space; latitude scaled slightly to approximate Mercator
  const yNorm = (lat - BOUNDS.lat.min) / (BOUNDS.lat.max - BOUNDS.lat.min);
  const y = (1 - yNorm) * h;
  return { x, y };
}

// RevPAR color scale: low (slate) -> mid (teal) -> high (brass)
function colorForRevpar(v: number) {
  if (v < 120) return '#94a3b8';
  if (v < 180) return '#1f7a73';
  if (v < 260) return '#134e4a';
  if (v < 360) return '#c9a149';
  return '#876723';
}
function colorForOcc(v: number) {
  if (v < 60) return '#991b1b';
  if (v < 70) return '#b45309';
  if (v < 80) return '#1f7a73';
  return '#134e4a';
}

export default function PropertyMap({ properties, colorBy }: Props) {
  const [hover, setHover] = useState<Property | null>(null);
  const W = 900, H = 420;

  const pins = useMemo(() =>
    properties.map((p) => ({
      ...p,
      ...project(p.lat, p.lng, W, H),
      r: 3 + Math.min(7, Math.sqrt(p.rooms) / 7),
      fill: colorBy === 'revpar' ? colorForRevpar(p.revpar_usd) : colorForOcc(p.occupancy_pct),
    })), [properties, colorBy]);

  return (
    <div className="relative w-full h-full bg-[var(--ivory-deep)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Backdrop landmass — a simplified outline as decorative tone */}
        <rect width={W} height={H} fill="#f1ede0" />
        {/* Grid graticules */}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`v${i}`} x1={(W / 6) * i} x2={(W / 6) * i} y1={0} y2={H} stroke="#e5dfcb" strokeWidth={1} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} y1={(H / 4) * i} y2={(H / 4) * i} x1={0} x2={W} stroke="#e5dfcb" strokeWidth={1} />
        ))}
        {/* US-ish outline (decorative) */}
        <path
          d="M 80 130 C 130 110, 200 100, 280 110 S 420 100, 500 115 S 640 110, 720 130 L 770 165 L 760 220 L 700 250 L 640 290 L 540 320 L 440 330 L 360 320 L 280 295 L 210 260 L 140 220 L 95 175 Z"
          fill="#e8e1cd" stroke="#d9d2b8" strokeWidth={1.2} opacity={0.7}
        />
        {/* Mexico / Caribbean cluster outline */}
        <path
          d="M 380 340 C 430 350, 470 380, 510 395 L 590 390 L 640 380 L 680 360 Z"
          fill="#e8e1cd" stroke="#d9d2b8" strokeWidth={1.2} opacity={0.6}
        />

        {pins.map((p) => (
          <g key={p.property_id} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={p.fill} stroke="#fafaf5" strokeWidth={0.8} opacity={0.92}>
              <title>{p.name}</title>
            </circle>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 border border-[var(--hairline)] rounded-md px-3 py-2 text-[11px] shadow-sm">
        <div className="font-semibold text-[var(--ink-strong)] uppercase tracking-wider text-[10px] mb-1.5">
          {colorBy === 'revpar' ? 'RevPAR (USD)' : 'Occupancy %'}
        </div>
        <div className="flex items-center gap-2.5">
          {colorBy === 'revpar' ? (
            <>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#94a3b8' }} /> &lt;120</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#1f7a73' }} /> 120–180</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#134e4a' }} /> 180–260</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#c9a149' }} /> 260+</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#991b1b' }} /> &lt;60</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#b45309' }} /> 60–70</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#1f7a73' }} /> 70–80</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#134e4a' }} /> 80+</span>
            </>
          )}
        </div>
      </div>

      {/* Hover card */}
      {hover && (
        <div className="absolute top-3 right-3 bg-white border border-[var(--hairline)] rounded-md px-3 py-2.5 text-xs shadow-md max-w-[280px]">
          <div className="font-serif text-base text-[var(--ink-strong)] leading-tight">{hover.name}</div>
          <div className="text-[var(--ink-soft)] mt-0.5">{hover.city}, {hover.state} · {hover.brand}</div>
          <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 tabular">
            <div><div className="text-[10px] uppercase text-[var(--ink-soft)]">Rooms</div><div className="font-semibold text-[var(--ink-strong)]">{hover.rooms}</div></div>
            <div><div className="text-[10px] uppercase text-[var(--ink-soft)]">Occ</div><div className="font-semibold text-[var(--ink-strong)]">{hover.occupancy_pct.toFixed(1)}%</div></div>
            <div><div className="text-[10px] uppercase text-[var(--ink-soft)]">RevPAR</div><div className="font-semibold text-[var(--ink-strong)]">{fmtCurrency(hover.revpar_usd)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
