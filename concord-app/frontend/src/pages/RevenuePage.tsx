import { useEffect, useState } from 'react';
import { fetchData, fmtCurrency, fmtNumber, fmtSignedPct } from '../api/data';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

type BarRow = { property_id: string; property_name: string; day_of_week: string; length_of_stay: number; bar_usd: number };
type Compset = { property_id: string; property_name: string; city: string; ardmore_adr: number; compset_median_adr: number; ari: number; mpi: number; rgi: number };
type Rec = { property_id: string; property_name: string; target_date: string; current_bar: number; recommended_bar: number; delta_pct: number; rationale: string; confidence: number; auto_apply: boolean };
type Revenue = {
  bar: BarRow[];
  compset: Compset[];
  pricing_recommendations: Rec[];
  pricing_agent: { model: string; inputs: string[]; refresh_cadence: string; governance: string };
};

type ForecastDaily = { date: string; dow: string; occ_pct: number; adr_usd: number; revpar_usd: number; has_event: boolean };
type Forecast = {
  horizon_days: number; model: string;
  projected_revenue_usd: number; projected_revpar_avg: number;
  daily: ForecastDaily[];
  events: { date: string; city: string; name: string; impact: string; adr_lift_pct: number }[];
};

export default function RevenuePage() {
  const [data, setData] = useState<Revenue | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    fetchData<Revenue>('/data/revenue.json').then(setData).catch(() => {});
    fetchData<Forecast>('/data/forecast.json').then(setForecast).catch(() => {});
  }, []);

  if (!data || !forecast) return <div className="p-8 text-[var(--ink-muted)]">Loading revenue desk…</div>;

  const chartData = forecast.daily.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="eyebrow mb-1">Revenue Desk · VP, Revenue Management</div>
        <h1 className="font-serif text-4xl tracking-tight">The pricing agent reads the gold layer.</h1>
        <p className="mt-3 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          BAR by property, length of stay, and day of week. Comp-set positioning live from Sabre +
          Amadeus. Dynamic-pricing recommendations from the Ardmore Pricing Agent — every input,
          output, and override is captured in dbt-tested gold tables.
        </p>
      </header>

      {/* Forecast chart */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)] flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="eyebrow">90-day demand forecast</div>
            <h2 className="font-serif text-2xl">RevPAR & occupancy projection</h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">Projected revenue</div>
            <div className="font-serif text-2xl text-[var(--ink-strong)] tabular">{fmtCurrency(forecast.projected_revenue_usd)}</div>
            <div className="text-[11px] text-[var(--ink-soft)]">avg RevPAR {fmtCurrency(forecast.projected_revpar_avg)}</div>
          </div>
        </div>
        <div className="h-72 p-3">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5dfcb" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} interval={6} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${v}`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderColor: '#e5dfcb' }} formatter={(v, name) => name === 'occ_pct' ? `${v}%` : `$${v}`} />
              {forecast.events.map((e) => {
                const idx = chartData.findIndex((d) => d.date === e.date);
                return idx >= 0 ? <ReferenceLine key={e.date} x={chartData[idx].label} stroke="#c9a149" strokeDasharray="2 3" yAxisId="left" /> : null;
              })}
              <Line yAxisId="left"  type="monotone" dataKey="revpar_usd" stroke="#134e4a" strokeWidth={2} dot={false} name="RevPAR (USD)" />
              <Line yAxisId="right" type="monotone" dataKey="occ_pct"    stroke="#c9a149" strokeWidth={2} dot={false} name="Occupancy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="px-5 py-3 border-t border-[var(--hairline-soft)] text-[12px] text-[var(--ink-muted)]">
          <strong className="text-[var(--ink-strong)]">Model:</strong> {forecast.model}
        </div>
      </section>

      {/* Events */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] mb-3">Demand events impacting the next 90 days</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forecast.events.map((e) => (
            <div key={e.name} className="research-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`status-pill ${e.impact === 'compression' ? 'brass' : 'teal'}`}>{e.impact}</span>
                <span className="text-[11px] tabular text-[var(--ink-soft)]">{e.date}</span>
              </div>
              <div className="font-serif text-lg text-[var(--ink-strong)] leading-tight">{e.name}</div>
              <div className="text-[var(--ink-soft)] text-sm">{e.city}</div>
              <div className="mt-2 text-sm text-[var(--good)] font-semibold tabular">ADR lift +{e.adr_lift_pct}%</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comp-set */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">Comp-set positioning</div>
          <h2 className="font-serif text-2xl">ARI · MPI · RGI</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Property</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">City</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Ardmore ADR</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Comp-set median</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">ARI</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">MPI</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">RGI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {data.compset.map((c) => (
              <tr key={c.property_id}>
                <td className="px-4 py-2.5 font-medium text-[var(--ink-strong)]">{c.property_name}</td>
                <td className="px-4 py-2.5 text-[var(--ink-muted)]">{c.city}</td>
                <td className="px-4 py-2.5 text-right tabular">{fmtCurrency(c.ardmore_adr)}</td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--ink-muted)]">{fmtCurrency(c.compset_median_adr)}</td>
                {[c.ari, c.mpi, c.rgi].map((idx, i) => (
                  <td key={i} className={`px-4 py-2.5 text-right tabular font-semibold ${idx >= 1.0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
                    {idx.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pricing recs */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)] flex items-center justify-between">
          <div>
            <div className="eyebrow">Pricing agent</div>
            <h2 className="font-serif text-2xl">Recommendations awaiting review</h2>
          </div>
          <div className="text-[11px] text-[var(--ink-soft)] text-right max-w-xs">
            <div><strong className="text-[var(--ink-strong)]">{data.pricing_agent.model}</strong></div>
            <div>{data.pricing_agent.refresh_cadence}</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Property</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Target date</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Current BAR</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Recommended</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Δ</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Rationale</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Conf</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Apply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {data.pricing_recommendations.map((r) => (
              <tr key={r.property_id + r.target_date}>
                <td className="px-4 py-2.5 font-medium text-[var(--ink-strong)]">{r.property_name}</td>
                <td className="px-4 py-2.5 tabular text-[var(--ink-muted)]">{r.target_date}</td>
                <td className="px-4 py-2.5 text-right tabular">{fmtCurrency(r.current_bar)}</td>
                <td className="px-4 py-2.5 text-right tabular font-semibold text-[var(--ink-strong)]">{fmtCurrency(r.recommended_bar)}</td>
                <td className={`px-4 py-2.5 text-right tabular font-semibold ${r.delta_pct >= 0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
                  {fmtSignedPct(r.delta_pct)}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--ink-muted)] max-w-[320px]">{r.rationale}</td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--ink-muted)]">{(r.confidence * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5">
                  <span className={`status-pill ${r.auto_apply ? 'good' : 'warn'}`}>
                    {r.auto_apply ? 'auto' : 'review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[var(--hairline-soft)] text-[12px] text-[var(--ink-muted)]">
          <strong className="text-[var(--ink-strong)]">Governance:</strong> {data.pricing_agent.governance}
          <div className="mt-1 font-mono text-[11px] text-[var(--ink-soft)]">
            Inputs: {data.pricing_agent.inputs.join(' · ')}
          </div>
        </div>
      </section>

      {/* BAR matrix */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">BAR matrix</div>
          <h2 className="font-serif text-2xl">Best available rate by LOS × DOW</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="h-72 min-w-[640px]">
            <ResponsiveContainer>
              <BarChart data={dayMatrix(data.bar)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5dfcb" />
                <XAxis dataKey="day_of_week" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#e5dfcb' }} formatter={(v) => `$${fmtNumber(v as number)}`} />
                <Bar dataKey="los_1" fill="#134e4a" name="1-night" radius={[2, 2, 0, 0]} />
                <Bar dataKey="los_2" fill="#1f7a73" name="2-night" radius={[2, 2, 0, 0]} />
                <Bar dataKey="los_3" fill="#c9a149" name="3+ night" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function dayMatrix(bar: BarRow[]) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return days.map((d) => {
    const rows = bar.filter((r) => r.day_of_week === d);
    const los_1 = avg(rows.filter((r) => r.length_of_stay === 1).map((r) => r.bar_usd));
    const los_2 = avg(rows.filter((r) => r.length_of_stay === 2).map((r) => r.bar_usd));
    const los_3 = avg(rows.filter((r) => r.length_of_stay === 3).map((r) => r.bar_usd));
    return { day_of_week: d, los_1: Math.round(los_1), los_2: Math.round(los_2), los_3: Math.round(los_3) };
  });
}
function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
