// Related-properties similarity engine.
//
// Computes a top-K nearest-neighbor list for each Ardmore Hotels property using
// weighted feature overlap.  Mirrors what an agent on the gold layer would
// produce in production — the math runs client-side so the static site can
// render the network without a runtime API.

export type Property = {
  property_id: string;
  name: string;
  brand: string;
  market_segment: string;
  region: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  rooms: number;
  adr_usd: number;
  occupancy_pct: number;
  revpar_usd: number;
  goppar_usd: number;
  otb_pace_vs_ly_pct: number;
  nps: number;
};

export type RelatedNeighbor = {
  property: Property;
  score: number;   // 0..1
  why: string;     // human-readable reason
};

// ---------------------------------------------------------------------------
// Feature helpers
// ---------------------------------------------------------------------------

// Brand tier bucket: Grand/Resorts = Luxury, Heritage = Upscale,
// Ardmore (base) = Upper-upscale, Select = Upper-midscale, Express = Midscale
function brandTier(brand: string): string {
  if (brand === 'Ardmore Grand' || brand === 'Ardmore Resorts') return 'luxury';
  if (brand === 'Ardmore Heritage') return 'upscale';
  if (brand === 'Ardmore') return 'upper-upscale';
  if (brand === 'Ardmore Select') return 'upper-midscale';
  if (brand === 'Ardmore Express') return 'midscale';
  return 'unknown';
}

// Market type derived from market_segment
function marketType(seg: string): string {
  if (seg === 'Luxury') return 'luxury';
  if (seg === 'Resort') return 'resort';
  if (seg === 'Upscale full-service' || seg === 'Upper-upscale') return 'full-service';
  if (seg === 'Upper-midscale select') return 'select';
  if (seg === 'Midscale select') return 'midscale';
  return 'other';
}

// ADR band in $100 buckets: 0-199, 200-299, 300-399, 400+
function adrBand(adr: number): string {
  if (adr < 200) return 'band-0';
  if (adr < 300) return 'band-1';
  if (adr < 400) return 'band-2';
  return 'band-3';
}

// Amenity tags inferred from brand + segment
function amenityTags(p: Property): string[] {
  const tags: string[] = [];
  const tier = brandTier(p.brand);
  const mt = marketType(p.market_segment);

  if (tier === 'luxury' || tier === 'upscale' || tier === 'upper-upscale') {
    tags.push('full-service-restaurant', 'concierge', 'valet');
  }
  if (mt === 'resort') {
    tags.push('pool', 'spa', 'beach-or-golf');
  }
  if (tier === 'luxury') {
    tags.push('spa', 'butler', 'fine-dining');
  }
  if (mt === 'select' || mt === 'midscale') {
    tags.push('grab-and-go', 'fitness-center');
  }
  if (tier !== 'midscale' && mt !== 'midscale') {
    tags.push('meeting-space');
  }
  if (p.rooms >= 300) {
    tags.push('large-convention');
  }
  return Array.from(new Set(tags));
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------
const W_BRAND_TIER  = 1.6;  // strongest signal — same tier, same experience promise
const W_MARKET_TYPE = 1.4;  // close second — urban select vs resort are very different
const W_REGION      = 0.9;  // same geography = competitive context
const W_ADR_BAND    = 0.7;  // price proximity
const W_AMENITY     = 0.6;  // inferred from brand/segment so partially redundant
const W_TOTAL = W_BRAND_TIER + W_MARKET_TYPE + W_REGION + W_ADR_BAND + W_AMENITY;

const K = 8;  // neighbors per property

// ---------------------------------------------------------------------------
// Jaccard
// ---------------------------------------------------------------------------
function jaccard(a: string[], b: string[]): { score: number; shared: string[] } {
  if (a.length === 0 || b.length === 0) return { score: 0, shared: [] };
  const setA = new Set(a);
  const shared = b.filter((x) => setA.has(x));
  const union = new Set([...a, ...b]).size;
  return { score: shared.length / union, shared };
}

// Exact-match dimension (brand tier, market type, region, adr band) → 0 or 1
function exact(a: string, b: string): number {
  return a === b ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Pairwise score
// ---------------------------------------------------------------------------
function pairScore(a: Property, b: Property): number {
  const bt = exact(brandTier(a.brand), brandTier(b.brand));
  const mt = exact(marketType(a.market_segment), marketType(b.market_segment));
  const rg = exact(a.region, b.region);
  const adr = exact(adrBand(a.adr_usd), adrBand(b.adr_usd));
  const am = jaccard(amenityTags(a), amenityTags(b)).score;

  const raw =
    W_BRAND_TIER * bt +
    W_MARKET_TYPE * mt +
    W_REGION * rg +
    W_ADR_BAND * adr +
    W_AMENITY * am;

  return raw / W_TOTAL;
}

// ---------------------------------------------------------------------------
// "Why related" copy
// ---------------------------------------------------------------------------
function whyCopy(a: Property, b: Property): string {
  const btA = brandTier(a.brand);
  const btB = brandTier(b.brand);
  const mtA = marketType(a.market_segment);
  const mtB = marketType(b.market_segment);

  if (a.brand === b.brand) return `Same brand (${a.brand})`;
  if (btA === btB && a.region === b.region) return `${a.region} ${btA} properties`;
  if (btA === btB) return `Both ${btA} tier`;
  if (mtA === mtB && a.region === b.region) return `${a.region} ${mtA} segment`;
  if (mtA === mtB) return `Both ${mtA} market type`;
  if (a.region === b.region) return `Same region (${a.region})`;
  if (adrBand(a.adr_usd) === adrBand(b.adr_usd)) return 'Similar ADR band';
  return 'Similar portfolio profile';
}

// ---------------------------------------------------------------------------
// Build cache
// ---------------------------------------------------------------------------
let _cache: Map<string, RelatedNeighbor[]> | null = null;
let _properties: Property[] = [];

export function initRelated(properties: Property[]): void {
  _properties = properties;
  _cache = null; // invalidate on re-init
}

function build(): Map<string, RelatedNeighbor[]> {
  const result = new Map<string, RelatedNeighbor[]>();
  const props = _properties;

  for (let i = 0; i < props.length; i++) {
    const a = props[i];
    const scored: (RelatedNeighbor)[] = [];

    for (let j = 0; j < props.length; j++) {
      if (i === j) continue;
      const b = props[j];
      const s = pairScore(a, b);
      if (s <= 0) continue;
      scored.push({
        property: b,
        score: s,
        why: whyCopy(a, b),
      });
    }

    scored.sort((x, y) => y.score - x.score);
    result.set(a.property_id, scored.slice(0, K));
  }

  return result;
}

export function relatedFor(propertyId: string): RelatedNeighbor[] {
  if (!_cache) _cache = build();
  return _cache.get(propertyId) ?? [];
}

// Build the full graph for the network visualization.
// Returns nodes + deduplicated edges (score >= threshold).
export type GraphNode = {
  id: string;
  name: string;
  brand: string;
  tier: string;
  region: string;
  adr: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  score: number;
};

const EDGE_THRESHOLD = 0.35;

export function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!_cache) _cache = build();

  const nodes: GraphNode[] = _properties.map((p) => ({
    id: p.property_id,
    name: p.name,
    brand: p.brand,
    tier: brandTier(p.brand),
    region: p.region,
    adr: p.adr_usd,
  }));

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const [pid, neighbors] of _cache.entries()) {
    for (const nb of neighbors) {
      if (nb.score < EDGE_THRESHOLD) continue;
      const key =
        pid < nb.property.property_id
          ? `${pid}::${nb.property.property_id}`
          : `${nb.property.property_id}::${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: pid, target: nb.property.property_id, score: nb.score });
    }
  }

  return { nodes, edges };
}

// Color by brand tier
const TIER_COLORS: Record<string, string> = {
  luxury:         '#c9a149',
  upscale:        '#1f7a73',
  'upper-upscale':'#134e4a',
  'upper-midscale':'#6b7280',
  midscale:       '#9ca3af',
  unknown:        '#d1d5db',
};

export function tierColor(tier: string): string {
  return TIER_COLORS[tier] ?? '#d1d5db';
}
