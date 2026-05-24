import { useEffect, useMemo, useState } from 'react';
import { fetchData, fmtCurrency, fmtNumber, fmtSignedPct } from '../api/data';
import PropertyMap from '../components/PropertyMap';
import { initRelated, relatedFor, type Property as RelatedProperty } from '../lib/related';

type Property = {
  property_id: string; name: string; brand: string; market_segment: string;
  region: string; city: string; state: string; lat: number; lng: number;
  rooms: number; adr_usd: number; occupancy_pct: number; revpar_usd: number;
  goppar_usd: number; otb_pace_vs_ly_pct: number; nps: number;
};

export default function PortfolioPage() {
  const [props, setProps] = useState<Property[]>([]);
  const [region, setRegion] = useState<string>('All');
  const [brand, setBrand] = useState<string>('All');
  const [colorBy, setColorBy] = useState<'revpar' | 'occupancy'>('revpar');
  const [sortKey, setSortKey] = useState<keyof Property>('revpar_usd');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchData<{ properties: Property[] }>('/data/properties.json')
      .then((d) => {
        setProps(d.properties);
        initRelated(d.properties as RelatedProperty[]);
      }).catch(() => {});
  }, []);

  const regions = useMemo(() => Array.from(new Set(props.map((p) => p.region))).sort(), [props]);
  const brands  = useMemo(() => Array.from(new Set(props.map((p) => p.brand))).sort(), [props]);

  const filtered = useMemo(() => {
    let f = props;
    if (region !== 'All') f = f.filter((p) => p.region === region);
    if (brand !== 'All') f = f.filter((p) => p.brand === brand);
    return [...f].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));
  }, [props, region, brand, sortKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="eyebrow mb-1">Portfolio</div>
        <h1 className="font-serif text-4xl tracking-tight">142 properties · {fmtNumber(filtered.reduce((s, p) => s + p.rooms, 0))} rooms in view.</h1>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <FilterSelect label="Region" value={region} options={['All', ...regions]} onChange={setRegion} />
        <FilterSelect label="Brand"  value={brand}  options={['All', ...brands]}  onChange={setBrand}  />
        <FilterSelect label="Color map by" value={colorBy} options={['revpar','occupancy']} onChange={(v) => setColorBy(v as 'revpar' | 'occupancy')} />
        <FilterSelect label="Sort by" value={sortKey} options={['revpar_usd','adr_usd','occupancy_pct','rooms','nps','otb_pace_vs_ly_pct']} onChange={(v) => setSortKey(v as keyof Property)} />
      </div>

      <div className="research-card overflow-hidden mb-8">
        <div className="h-[440px]">
          <PropertyMap properties={filtered} colorBy={colorBy} />
        </div>
      </div>

      <div className="research-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ivory-deep)] text-[var(--ink-muted)] sticky top-0">
            <tr>
              <th className="text-left  px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Property</th>
              <th className="text-left  px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Brand · Segment</th>
              <th className="text-left  px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Location</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Rooms</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">Occ %</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">ADR</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">RevPAR</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">GOPPAR</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">OTB vs LY</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold">NPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft)]">
            {filtered.map((p) => (
              <tr
                key={p.property_id}
                onClick={() => setSelectedProperty(selectedProperty?.property_id === p.property_id ? null : p)}
                className={`cursor-pointer hover:bg-[var(--ivory-deep)]/40 ${selectedProperty?.property_id === p.property_id ? 'bg-[var(--brass-bg)]' : ''}`}
              >
                <td className="px-4 py-2 font-medium text-[var(--ink-strong)]">{p.name}</td>
                <td className="px-4 py-2 text-[var(--ink-muted)]">
                  <div>{p.brand}</div>
                  <div className="text-[11px] text-[var(--ink-soft)]">{p.market_segment}</div>
                </td>
                <td className="px-4 py-2 text-[var(--ink-muted)]">{p.city}, {p.state}</td>
                <td className="px-4 py-2 text-right tabular">{p.rooms}</td>
                <td className="px-4 py-2 text-right tabular">{p.occupancy_pct.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right tabular">{fmtCurrency(p.adr_usd)}</td>
                <td className="px-4 py-2 text-right tabular font-semibold text-[var(--ink-strong)]">{fmtCurrency(p.revpar_usd)}</td>
                <td className="px-4 py-2 text-right tabular text-[var(--ink-muted)]">{fmtCurrency(p.goppar_usd)}</td>
                <td className={`px-4 py-2 text-right tabular font-semibold ${p.otb_pace_vs_ly_pct >= 0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
                  {fmtSignedPct(p.otb_pace_vs_ly_pct)}
                </td>
                <td className="px-4 py-2 text-right tabular">{p.nps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related Properties panel — appears when a row is selected */}
      {selectedProperty && (
        <RelatedPanel property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      )}
    </div>
  );
}

function RelatedPanel({ property, onClose }: { property: Property; onClose: () => void }) {
  const neighbors = relatedFor(property.property_id);

  return (
    <div className="mt-6 research-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--hairline-soft)] flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow mb-0.5">Related Properties</div>
          <h2 className="font-serif text-xl leading-tight">
            Properties most similar to {property.name}
          </h2>
          <p className="text-[11px] text-[var(--ink-soft)] mt-1">
            Ranked by brand tier, market type, region, and ADR band similarity. Top 8.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close related panel"
          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-sm border border-[var(--hairline)] text-[var(--ink-soft)] hover:bg-[var(--ivory-deep)] transition text-lg leading-none"
        >
          ×
        </button>
      </div>

      {neighbors.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[var(--ink-muted)]">No similar properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[var(--hairline-soft)]">
          {neighbors.map((nb, idx) => (
            <div key={nb.property.property_id} className="px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  #{idx + 1}
                </span>
                <span className="font-mono text-[9px] font-semibold text-[var(--brass-dim)]">
                  {Math.round(nb.score * 100)}% match
                </span>
              </div>
              <div className="font-serif text-[15px] leading-snug text-[var(--ink-strong)]">
                {nb.property.name}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                {nb.property.brand}
              </div>
              <div className="text-[11px] text-[var(--ink-soft)]">
                {nb.property.city}, {nb.property.state} · {nb.property.region}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--ink-muted)]">
                <span>ADR {fmtCurrency(nb.property.adr_usd)}</span>
                <span>RevPAR {fmtCurrency(nb.property.revpar_usd)}</span>
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--brass-dim)]">
                {nb.why}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-[var(--hairline-soft)] bg-[var(--ivory-deep)] text-[10px] text-[var(--ink-soft)]">
        Similarity model: brand tier (weight 1.6), market type (1.4), region (0.9), ADR band (0.7), amenity tags (0.6).
        Pre-computed at page load from the static properties snapshot — mirrors a Snowflake semantic model on the dbt-governed layer
        in production.
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[var(--ink-muted)]">
      <span className="font-semibold uppercase tracking-wider text-[10px]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-[var(--hairline)] bg-white px-2 py-1.5 text-[12px] text-[var(--ink-strong)] focus:outline-none focus:border-[var(--brass)]"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
