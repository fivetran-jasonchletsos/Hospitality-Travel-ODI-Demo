import { useEffect, useState } from 'react';
import { fetchData, fmtCompact, fmtNumber } from '../api/data';

type Connector = {
  name: string; type: string; destination: string;
  status: 'healthy' | 'degraded' | 'failed';
  last_sync_min_ago: number; rows_24h: number; freshness_target_min: number;
  note?: string;
  fivetran_id?: string;
  fivetran_url?: string;
};
type Layer = { layer: string; tables: number; rows_total: number; last_built_min_ago: number; tests_passing: number; tests_failing: number };
type Pipeline = {
  generated_at: string;
  connectors: Connector[];
  layers: Layer[];
  lineage_label: string;
  failure_simulator: { note: string };
};

export default function PipelinePage() {
  const [data, setData] = useState<Pipeline | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  useEffect(() => {
    fetchData<Pipeline>('/data/pipeline.json').then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="p-8 text-[var(--ink-muted)]">Loading pipeline status…</div>;

  const connectors = simulateFail
    ? data.connectors.map((c) => c.type === 'OTA' ? { ...c, status: 'failed' as const, last_sync_min_ago: 47, note: 'Simulated failure — Fivetran retry with exponential backoff. dbt freshness test will fire in 3 min.' } : c)
    : data.connectors;

  const healthy = connectors.filter((c) => c.status === 'healthy').length;
  const degraded = connectors.filter((c) => c.status === 'degraded').length;
  const failed = connectors.filter((c) => c.status === 'failed').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow mb-1">Pipeline · {new Date(data.generated_at).toLocaleString()}</div>
          <h1 className="font-serif text-4xl tracking-tight">Sources, sync, and the medallion.</h1>
          <p className="mt-3 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
            {data.connectors.length} Fivetran connectors keep Ardmore's bronze layer fresh.
            dbt builds four medallion layers on Snowflake + Iceberg.
            <span className="block mt-2 text-sm">
              <strong className="text-[var(--ink-strong)]">Lineage label:</strong> {data.lineage_label}.
            </span>
          </p>
        </div>
        <button
          onClick={() => setSimulateFail((s) => !s)}
          className={`text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-sm border ${
            simulateFail
              ? 'bg-[var(--bad-bg)] text-[var(--bad)] border-[var(--bad)]/30'
              : 'bg-white text-[var(--ink-muted)] border-[var(--hairline)] hover:bg-[var(--ivory-deep)]'
          }`}
        >
          {simulateFail ? 'Restore OTA connectors' : 'Simulate OTA connector failure'}
        </button>
      </header>

      {/* Health summary */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="kpi-tile">
          <div className="kpi-label">Connectors</div>
          <div className="kpi-value tabular">{connectors.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Healthy</div>
          <div className="kpi-value tabular text-[var(--good)]">{healthy}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Degraded</div>
          <div className="kpi-value tabular" style={{ color: degraded ? 'var(--warn)' : 'var(--ink-soft)' }}>{degraded}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Failed</div>
          <div className="kpi-value tabular" style={{ color: failed ? 'var(--bad)' : 'var(--ink-soft)' }}>{failed}</div>
        </div>
      </section>

      {/* Connector table */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)] flex items-center justify-between">
          <div>
            <div className="eyebrow">Bronze landing</div>
            <h2 className="font-serif text-xl">Fivetran connector status</h2>
          </div>
          <a
            href="https://fivetran.com/dashboard/connectors"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border bg-[var(--teal)]/5 text-[var(--teal)] border-[var(--teal)]/20 hover:bg-[var(--teal)]/10 transition-colors"
          >
            Open in Fivetran
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M14 2 8 8" />
            </svg>
          </a>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)]">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Connector</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Type</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Destination</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Status</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Last sync</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Rows / 24h</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Connector ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {connectors.map((c) => (
              <tr key={c.name} className="hover:bg-[var(--ivory-deep)]/40 transition-colors duration-100">
                <td className="px-4 py-2.5 font-medium text-[var(--ink-strong)]">{c.name}</td>
                <td className="px-4 py-2.5 text-[var(--ink-muted)]">{c.type}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--ink-muted)]">{c.destination}</td>
                <td className="px-4 py-2.5">
                  <span className={`status-pill ${c.status === 'healthy' ? 'good' : c.status === 'degraded' ? 'warn' : 'bad'}`}>
                    {c.status}
                  </span>
                  {c.note && <div className="mt-1 text-[11px] text-[var(--ink-soft)] italic">{c.note}</div>}
                </td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--ink-muted)]">
                  {c.last_sync_min_ago} min ago
                  <div className="text-[10px] text-[var(--ink-soft)]">target ≤ {c.freshness_target_min} min</div>
                </td>
                <td className="px-4 py-2.5 text-right tabular text-[var(--ink-strong)] font-semibold">{fmtCompact(c.rows_24h)}</td>
                <td className="px-4 py-2.5">
                  {c.fivetran_id && c.fivetran_url ? (
                    <a
                      href={c.fivetran_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--teal-soft)] hover:text-[var(--teal)] hover:underline transition-colors"
                      title={`Open connector ${c.fivetran_id} in Fivetran`}
                    >
                      {c.fivetran_id}
                      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 2h5v5M14 2 8 8" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-[var(--ink-soft)] text-[11px]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      {/* dbt layers */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">Transform</div>
          <h2 className="font-serif text-xl">dbt medallion · four layers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
          {data.layers.map((l) => (
            <div key={l.layer} className="p-5">
              <div className={`layer-chip ${l.layer === 'gold' ? 'gold' : l.layer === 'silver' ? 'silver' : l.layer === 'bronze' ? 'bronze' : 'platinum'} mb-2`}>{l.layer}</div>
              <div className="font-serif text-2xl text-[var(--ink-strong)] tabular">{l.tables}</div>
              <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-wider">tables</div>
              <div className="mt-3 text-sm text-[var(--ink-muted)] tabular">{fmtCompact(l.rows_total)} rows</div>
              <div className="text-[11px] text-[var(--ink-soft)]">built {l.last_built_min_ago} min ago</div>
              <div className="mt-3 text-[12px]">
                <span className="text-[var(--good)] font-semibold">{l.tests_passing} passing</span>
                <span className="text-[var(--ink-soft)]"> · </span>
                <span className={l.tests_failing ? 'text-[var(--bad)] font-semibold' : 'text-[var(--ink-soft)]'}>
                  {l.tests_failing} failing
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="research-card p-5 bg-[var(--ivory-deep)]/50 text-sm">
        <div className="eyebrow mb-1">Failure-recovery story</div>
        <p className="text-[var(--ink-muted)] leading-relaxed">{data.failure_simulator.note}</p>
        <p className="mt-2 text-[var(--ink-muted)] leading-relaxed">
          Total bronze volume: <strong className="text-[var(--ink-strong)] tabular">{fmtNumber(data.layers.find((l) => l.layer === 'bronze')!.rows_total)}</strong> rows
          across <strong className="text-[var(--ink-strong)]">{data.layers.find((l) => l.layer === 'bronze')!.tables}</strong> tables.
          Gold layer materializes every 15 min on the same Iceberg files the agents read.
        </p>
      </section>
    </div>
  );
}
