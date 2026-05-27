// Data fetch helpers — read the Snowflake gold layer (Fastly-cached)
// via Fivetran ingest + dbt transforms. In the live demo, these would call
// an Athena/Snowflake-fronted API; here we serve the snapshot directly.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const cache = new Map<string, Promise<unknown>>();

export function fetchData<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as Promise<T>;
  const p = (async () => {
    const url = `${BASE}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
    return res.json() as Promise<T>;
  })();
  cache.set(path, p);
  return p;
}

export function fmtCurrency(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: digits,
  }).format(n);
}

export function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

export function fmtSignedPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}
