import { useEffect, useMemo, useState } from 'react';
import { fetchData, fmtCurrency, fmtNumber, fmtSignedPct } from '../api/data';
import PropertyMap from '../components/PropertyMap';

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

  useEffect(() => {
    fetchData<{ properties: Property[] }>('/data/properties.json')
      .then((d) => setProps(d.properties)).catch(() => {});
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
              <tr key={p.property_id} className="hover:bg-[var(--ivory-deep)]/40">
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
