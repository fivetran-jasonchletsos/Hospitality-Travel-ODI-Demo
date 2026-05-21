import { useEffect, useState } from 'react';
import { fetchData, fmtNumber, fmtSignedPct } from '../api/data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Cat = { category: string; share_pct: number; ttr_minutes: number; severity_avg: number };
type PropNps = { property_id: string; property_name: string; brand: string; nps: number; responses_30d: number; promoters_pct: number; detractors_pct: number };
type SocialRow = { source: string; mentions_24h: number; sentiment_score: number; share_positive_pct: number; share_negative_pct: number; top_topic: string };
type Loyalty = { total_members: number; point_liability_usd: number; redemption_rate_pct: number; active_members_ttm: number; tiers: { tier: string; share_pct: number; members: number; adr_uplift_pct: number; avg_stays_per_yr: number; avg_ltv: number }[]; top_members: { rank: number; name: string; tier: string; stays_ttm: number; nights_ttm: number; lifetime_value_usd: number; pref_brand: string; home_market: string }[] };
type Guest = {
  system_nps: number;
  nps_band: { promoters_pct: number; passives_pct: number; detractors_pct: number };
  ttr_overall_minutes: number; ttr_target_minutes: number;
  complaint_categories: Cat[];
  nps_by_property: PropNps[];
  nps_bottom_10: PropNps[];
  social_listening: SocialRow[];
  recent_critical_cases: { case_id: string; property: string; issue: string; source: string; sentiment: number; opened_min_ago: number; status: string }[];
};

const TIER_CLASS: Record<string, string> = { Silver: 'silver', Gold: 'gold', Platinum: 'platinum', Black: 'black' };

export default function GuestPage() {
  const [data, setData] = useState<Guest | null>(null);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  useEffect(() => {
    fetchData<Guest>('/data/guest_experience.json').then(setData).catch(() => {});
    fetchData<Loyalty>('/data/loyalty.json').then(setLoyalty).catch(() => {});
  }, []);

  if (!data || !loyalty) return <div className="p-8 text-[var(--ink-muted)]">Loading guest experience…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="eyebrow mb-1">Guest Experience · Chief Customer Officer</div>
        <h1 className="font-serif text-4xl tracking-tight">NPS, complaints, social — one place.</h1>
        <p className="mt-3 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Salesforce Service Cloud cases, NPS survey responses, and social mentions joined to the
          unified guest identity. A case opened by a Black-tier member at 14:38 routes to a senior
          agent at 14:39 — same gold table, same minute.
        </p>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="kpi-tile">
          <div className="kpi-label">System NPS</div>
          <div className="kpi-value tabular">{data.system_nps}</div>
          <div className="kpi-delta-good">{fmtSignedPct(3)} vs LY</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Promoters</div>
          <div className="kpi-value tabular text-[var(--good)]">{data.nps_band.promoters_pct}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Detractors</div>
          <div className="kpi-value tabular text-[var(--bad)]">{data.nps_band.detractors_pct}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Time to resolve</div>
          <div className="kpi-value tabular">{data.ttr_overall_minutes}<span className="text-base text-[var(--ink-soft)] ml-1">min</span></div>
          <div className="kpi-delta-neutral">target ≤ {data.ttr_target_minutes} min</div>
        </div>
      </section>

      {/* Complaints + Social */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="lg:col-span-2 research-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
            <div className="eyebrow">Complaint categories · 30 days</div>
            <h2 className="font-serif text-xl">Where guests friction</h2>
          </div>
          <div className="h-72 p-3">
            <ResponsiveContainer>
              <BarChart data={data.complaint_categories} layout="vertical" margin={{ top: 6, right: 16, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5dfcb" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="category" width={170} tick={{ fontSize: 11, fill: '#1f2937' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#e5dfcb' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="share_pct" fill="#134e4a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="research-card">
          <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
            <div className="eyebrow">Social listening · 24h</div>
            <h2 className="font-serif text-xl">Sentiment across channels</h2>
          </div>
          <ul className="divide-y divide-[var(--hairline-soft)]">
            {data.social_listening.map((s) => (
              <li key={s.source} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--ink-strong)]">{s.source}</span>
                  <span className={`text-xs font-semibold tabular ${s.sentiment_score >= 0.2 ? 'text-[var(--good)]' : s.sentiment_score >= 0 ? 'text-[var(--ink-muted)]' : 'text-[var(--bad)]'}`}>
                    {s.sentiment_score >= 0 ? '+' : ''}{s.sentiment_score.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                  {fmtNumber(s.mentions_24h)} mentions · {s.share_positive_pct}% pos · {s.share_negative_pct}% neg
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] mt-0.5 italic">Top topic: {s.top_topic}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Critical cases */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">Critical cases · open now</div>
          <h2 className="font-serif text-xl">Routed in &lt; 60 seconds</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Case</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Property</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Issue</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Source</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Sentiment</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Age</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {data.recent_critical_cases.map((c) => (
              <tr key={c.case_id}>
                <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--brass-dim)]">{c.case_id}</td>
                <td className="px-4 py-2.5 font-medium text-[var(--ink-strong)]">{c.property}</td>
                <td className="px-4 py-2.5 text-[var(--ink-muted)]">{c.issue}</td>
                <td className="px-4 py-2.5 text-[var(--ink-muted)]">{c.source}</td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--bad)] font-semibold">{c.sentiment.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--ink-muted)]">{c.opened_min_ago} min</td>
                <td className="px-4 py-2.5">
                  <span className={`status-pill ${c.status === 'Resolved' ? 'good' : c.status === 'GM-engaged' ? 'warn' : 'bad'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Loyalty */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="research-card p-5 lg:col-span-1">
          <div className="eyebrow mb-2">Loyalty mix</div>
          <h2 className="font-serif text-2xl">Tier distribution</h2>
          <div className="h-56 mt-3">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={loyalty.tiers} dataKey="share_pct" nameKey="tier" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {loyalty.tiers.map((t, i) => (
                    <Cell key={t.tier} fill={['#94a3b8','#c9a149','#075985','#0c1f1d'][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, _n, p: any) => [`${v}% · ${fmtNumber(p.payload.members)} members`, p.payload.tier]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 text-[12px] space-y-1">
            {loyalty.tiers.map((t) => (
              <li key={t.tier} className="flex items-center justify-between">
                <span className={`tier-pill ${TIER_CLASS[t.tier]}`}>{t.tier}</span>
                <span className="tabular text-[var(--ink-muted)]">{fmtNumber(t.members)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="research-card overflow-hidden lg:col-span-2">
          <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
            <div className="eyebrow">Most engaged members</div>
            <h2 className="font-serif text-2xl">Top 20 by trailing-12-month stays</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Member</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Tier</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Stays</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Nights</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">LTV</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Pref brand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {loyalty.top_members.map((m) => (
                <tr key={m.rank}>
                  <td className="px-4 py-2 font-medium text-[var(--ink-strong)]">{m.name}</td>
                  <td className="px-4 py-2"><span className={`tier-pill ${TIER_CLASS[m.tier]}`}>{m.tier}</span></td>
                  <td className="px-4 py-2 text-right tabular">{m.stays_ttm}</td>
                  <td className="px-4 py-2 text-right tabular">{m.nights_ttm}</td>
                  <td className="px-4 py-2 text-right tabular font-semibold text-[var(--ink-strong)]">${fmtNumber(m.lifetime_value_usd)}</td>
                  <td className="px-4 py-2 text-[var(--ink-muted)]">{m.pref_brand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* NPS bottom 10 */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">Properties needing attention</div>
          <h2 className="font-serif text-xl">Bottom 10 NPS — call list</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
            <tr>
              <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Property</th>
              <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Brand</th>
              <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">NPS</th>
              <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Promoters %</th>
              <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Detractors %</th>
              <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Responses 30d</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {data.nps_bottom_10.map((p) => (
              <tr key={p.property_id}>
                <td className="px-4 py-2 font-medium text-[var(--ink-strong)]">{p.property_name}</td>
                <td className="px-4 py-2 text-[var(--ink-muted)]">{p.brand}</td>
                <td className="px-4 py-2 text-right tabular font-semibold text-[var(--bad)]">{p.nps}</td>
                <td className="px-4 py-2 text-right tabular">{p.promoters_pct}%</td>
                <td className="px-4 py-2 text-right tabular text-[var(--bad)]">{p.detractors_pct}%</td>
                <td className="px-4 py-2 text-right tabular text-[var(--ink-muted)]">{p.responses_30d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
