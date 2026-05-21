import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchData, fmtCompact, fmtCurrency, fmtNumber, fmtPct, fmtSignedPct } from '../api/data';
import PropertyMap from '../components/PropertyMap';

type Kpi = { label: string; value: number; format: string; delta_vs_ly_pct?: number };
type Summary = {
  generated_at: string;
  as_of_date: string;
  kpis: Kpi[];
  top_ops_issues: { severity: 'high' | 'medium' | 'low'; title: string; detail: string }[];
};
type Property = {
  property_id: string; name: string; brand: string; market_segment: string;
  region: string; city: string; state: string; lat: number; lng: number;
  rooms: number; adr_usd: number; occupancy_pct: number; revpar_usd: number;
  otb_pace_vs_ly_pct: number; nps: number;
};

function formatKpi(k: Kpi): string {
  switch (k.format) {
    case 'currency': return fmtCurrency(k.value, k.value < 1000 ? 0 : 0);
    case 'percent':  return fmtPct(k.value, 1);
    case 'percent_signed': return fmtSignedPct(k.value);
    case 'int': return k.value >= 1_000_000 ? fmtCompact(k.value) : fmtNumber(k.value);
    default: return String(k.value);
  }
}

export default function HomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [props, setProps] = useState<Property[]>([]);
  useEffect(() => {
    fetchData<Summary>('/data/summary.json').then(setSummary).catch(() => {});
    fetchData<{ properties: Property[] }>('/data/properties.json')
      .then((d) => setProps(d.properties)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow mb-1">Executive Dashboard · {summary?.as_of_date ?? '—'}</div>
        <h1 className="font-serif text-4xl tracking-tight">A view of the entire portfolio.</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Concord Hotels operates {summary ? fmtNumber(summary.kpis[0].value as number) : '142'} properties
          and {summary ? fmtNumber(summary.kpis[1].value as number) : '24,000'} rooms across the Americas.
          Every number on this page is reconciled from Oracle Opera PMS, Sabre / Amadeus, OTA partner
          feeds, Salesforce Service Cloud, and Cendyn loyalty — landed by Fivetran into a single
          Snowflake + Apache Iceberg gold layer and read by humans and pricing agents alike.
        </p>
      </header>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {summary?.kpis.map((k) => (
          <div key={k.label} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value tabular">{formatKpi(k)}</div>
            {k.delta_vs_ly_pct !== undefined && (
              <div className={k.delta_vs_ly_pct >= 0 ? 'kpi-delta-good' : 'kpi-delta-bad'}>
                {fmtSignedPct(k.delta_vs_ly_pct)} <span className="text-[var(--ink-soft)] font-normal">vs LY</span>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Map + ops issues */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="lg:col-span-2 research-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--hairline-soft)] flex items-center justify-between">
            <div>
              <div className="eyebrow">Portfolio Map</div>
              <h2 className="font-serif text-xl">Properties color-coded by RevPAR</h2>
            </div>
            <Link to="/portfolio" className="text-xs font-semibold uppercase tracking-wider text-[var(--brass-dim)] hover:text-[var(--brass)]">View all →</Link>
          </div>
          <div className="h-[420px]">
            <PropertyMap properties={props} colorBy="revpar" />
          </div>
        </div>

        <div className="research-card">
          <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
            <div className="eyebrow">Operations</div>
            <h2 className="font-serif text-xl">Top 3 issues for the CCO</h2>
          </div>
          <ul className="divide-y divide-[var(--hairline-soft)]">
            {summary?.top_ops_issues.map((iss, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`status-pill ${iss.severity === 'high' ? 'bad' : iss.severity === 'medium' ? 'warn' : 'good'}`}>
                    {iss.severity}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">#{i + 1}</span>
                </div>
                <div className="font-serif text-base text-[var(--ink-strong)] leading-tight">{iss.title}</div>
                <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{iss.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Region snapshot */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="eyebrow">By Region</div>
            <h2 className="font-serif text-2xl">Same-store performance</h2>
          </div>
          <Link to="/revenue" className="text-xs font-semibold uppercase tracking-wider text-[var(--brass-dim)] hover:text-[var(--brass)]">Revenue desk →</Link>
        </div>
        <RegionTable properties={props} />
      </section>
    </div>
  );
}

function RegionTable({ properties }: { properties: Property[] }) {
  const regions = new Map<string, Property[]>();
  for (const p of properties) {
    if (!regions.has(p.region)) regions.set(p.region, []);
    regions.get(p.region)!.push(p);
  }
  const rows = Array.from(regions.entries()).map(([region, props]) => {
    const rooms = props.reduce((s, p) => s + p.rooms, 0);
    const adr = props.reduce((s, p) => s + p.adr_usd * p.rooms, 0) / rooms;
    const occ = props.reduce((s, p) => s + p.occupancy_pct * p.rooms, 0) / rooms;
    const revpar = adr * occ / 100;
    const otb = props.reduce((s, p) => s + p.otb_pace_vs_ly_pct * p.rooms, 0) / rooms;
    return { region, count: props.length, rooms, adr, occ, revpar, otb };
  }).sort((a, b) => b.revpar - a.revpar);

  return (
    <div className="research-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
          <tr>
            <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Region</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Properties</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Rooms</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Occ %</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">ADR</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">RevPAR</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">OTB pace vs LY</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--hairline-soft)]">
          {rows.map((r) => (
            <tr key={r.region} className="hover:bg-[var(--ivory-deep)]/40">
              <td className="px-4 py-2.5 font-medium text-[var(--ink-strong)]">{r.region}</td>
              <td className="px-4 py-2.5 text-right tabular">{r.count}</td>
              <td className="px-4 py-2.5 text-right tabular">{fmtNumber(r.rooms)}</td>
              <td className="px-4 py-2.5 text-right tabular">{r.occ.toFixed(1)}%</td>
              <td className="px-4 py-2.5 text-right tabular">{fmtCurrency(r.adr)}</td>
              <td className="px-4 py-2.5 text-right tabular font-semibold text-[var(--ink-strong)]">{fmtCurrency(r.revpar)}</td>
              <td className={`px-4 py-2.5 text-right tabular font-semibold ${r.otb >= 0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
                {fmtSignedPct(r.otb)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
