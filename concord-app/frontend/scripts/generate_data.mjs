// Generate synthetic Concord Hotels data snapshots for the ODI demo.
// Deterministic via a seeded PRNG so the COO sees stable numbers between runs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/data');
fs.mkdirSync(OUT, { recursive: true });

// Mulberry32 PRNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260521);
const rand = (min, max) => min + rng() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Properties — 142 across 28 US states + Mexico/Caribbean resort portfolio
// ---------------------------------------------------------------------------
const BRANDS = [
  { name: 'Concord Grand',     segment: 'Luxury',           adrBase: 410, occBase: 78, rooms: [280, 520] },
  { name: 'Concord',           segment: 'Upper-upscale',    adrBase: 285, occBase: 76, rooms: [180, 320] },
  { name: 'Concord Heritage',  segment: 'Upscale full-service', adrBase: 225, occBase: 73, rooms: [140, 260] },
  { name: 'Concord Select',    segment: 'Upper-midscale select', adrBase: 165, occBase: 75, rooms: [110, 180] },
  { name: 'Concord Express',   segment: 'Midscale select',  adrBase: 132, occBase: 72, rooms: [90, 140] },
  { name: 'Concord Resorts',   segment: 'Resort',           adrBase: 480, occBase: 70, rooms: [240, 600] },
];

const REGIONS = [
  // [region, [{state, city, lat, lng, weight}...]]
  ['Northeast', [
    ['NY', 'New York',      40.7580, -73.9855, 6], ['NY', 'Brooklyn', 40.6782, -73.9442, 1],
    ['MA', 'Boston',        42.3601, -71.0589, 3], ['MA', 'Cambridge', 42.3736, -71.1097, 1],
    ['PA', 'Philadelphia',  39.9526, -75.1652, 2], ['PA', 'Pittsburgh', 40.4406, -79.9959, 1],
    ['NJ', 'Newark',        40.7357, -74.1724, 1], ['CT', 'Stamford', 41.0534, -73.5387, 1],
    ['DC', 'Washington',    38.9072, -77.0369, 3], ['MD', 'Baltimore', 39.2904, -76.6122, 1],
    ['VA', 'Arlington',     38.8816, -77.0910, 2],
  ]],
  ['Southeast', [
    ['FL', 'Miami',         25.7617, -80.1918, 4], ['FL', 'Orlando',  28.5383, -81.3792, 4],
    ['FL', 'Tampa',         27.9506, -82.4572, 2], ['FL', 'Naples',   26.1420, -81.7948, 2],
    ['FL', 'Key West',      24.5551, -81.7800, 1], ['FL', 'Fort Lauderdale', 26.1224, -80.1373, 2],
    ['GA', 'Atlanta',       33.7490, -84.3880, 3], ['GA', 'Savannah', 32.0809, -81.0912, 1],
    ['NC', 'Charlotte',     35.2271, -80.8431, 2], ['NC', 'Asheville', 35.5951, -82.5515, 1],
    ['SC', 'Charleston',    32.7765, -79.9311, 2], ['SC', 'Hilton Head', 32.2163, -80.7526, 1],
    ['TN', 'Nashville',     36.1627, -86.7816, 3], ['TN', 'Memphis',  35.1495, -90.0490, 1],
  ]],
  ['Midwest', [
    ['IL', 'Chicago',       41.8781, -87.6298, 5], ['MI', 'Detroit',  42.3314, -83.0458, 1],
    ['OH', 'Cleveland',     41.4993, -81.6944, 1], ['OH', 'Columbus', 39.9612, -82.9988, 2],
    ['MN', 'Minneapolis',   44.9778, -93.2650, 2], ['MO', 'St. Louis', 38.6270, -90.1994, 1],
    ['MO', 'Kansas City',   39.0997, -94.5786, 1], ['IN', 'Indianapolis', 39.7684, -86.1581, 1],
    ['WI', 'Milwaukee',     43.0389, -87.9065, 1],
  ]],
  ['South Central', [
    ['TX', 'Dallas',        32.7767, -96.7970, 3], ['TX', 'Houston',  29.7604, -95.3698, 3],
    ['TX', 'Austin',        30.2672, -97.7431, 3], ['TX', 'San Antonio', 29.4241, -98.4936, 2],
    ['LA', 'New Orleans',   29.9511, -90.0715, 2], ['OK', 'Oklahoma City', 35.4676, -97.5164, 1],
  ]],
  ['Mountain West', [
    ['CO', 'Denver',        39.7392, -104.9903, 3], ['CO', 'Aspen',   39.1911, -106.8175, 1],
    ['UT', 'Salt Lake City', 40.7608, -111.8910, 1], ['UT', 'Park City', 40.6461, -111.4980, 1],
    ['AZ', 'Phoenix',       33.4484, -112.0740, 2], ['AZ', 'Scottsdale', 33.4942, -111.9261, 2],
    ['AZ', 'Sedona',        34.8697, -111.7610, 1], ['NV', 'Las Vegas', 36.1699, -115.1398, 3],
    ['NM', 'Santa Fe',      35.6870, -105.9378, 1],
  ]],
  ['West Coast', [
    ['CA', 'Los Angeles',   34.0522, -118.2437, 4], ['CA', 'San Francisco', 37.7749, -122.4194, 4],
    ['CA', 'San Diego',     32.7157, -117.1611, 3], ['CA', 'Napa',    38.2975, -122.2869, 1],
    ['CA', 'Santa Barbara', 34.4208, -119.6982, 1], ['CA', 'Anaheim', 33.8366, -117.9143, 2],
    ['WA', 'Seattle',       47.6062, -122.3321, 3], ['OR', 'Portland', 45.5152, -122.6784, 1],
  ]],
  ['Mexico / Caribbean', [
    ['MX', 'Cancún',        21.1619, -86.8515, 2], ['MX', 'Cabo San Lucas', 22.8905, -109.9167, 1],
    ['MX', 'Playa del Carmen', 20.6296, -87.0739, 1], ['MX', 'Mexico City', 19.4326, -99.1332, 1],
    ['PR', 'San Juan',      18.4655, -66.1057, 1], ['VI', 'St. Thomas', 18.3358, -64.8963, 1],
    ['BS', 'Nassau',        25.0343, -77.3963, 1], ['AW', 'Oranjestad', 12.5092, -70.0086, 1],
  ]],
];

function weightedPick(items) {
  const total = items.reduce((s, x) => s + x[4], 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it[4];
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

const PROPERTIES = [];
const TOTAL = 142;
// Distribute by weighted region pool
const regionPool = [];
for (const [region, cities] of REGIONS) {
  for (const c of cities) regionPool.push({ region, city: c });
}

let propId = 1001;
for (let i = 0; i < TOTAL; i++) {
  // Mexico/Caribbean weighted lower — ~8% of portfolio
  const useResorts = rng() < 0.085;
  let entry;
  if (useResorts) {
    const r = REGIONS.find(([n]) => n === 'Mexico / Caribbean');
    entry = { region: r[0], city: weightedPick(r[1]) };
  } else {
    const choices = regionPool.filter((p) => p.region !== 'Mexico / Caribbean');
    entry = choices[Math.floor(rng() * choices.length)];
  }
  const [stateCode, city, lat, lng] = entry.city;
  // Brand: resorts in Mexico/Caribbean disproportionately Concord Resorts
  let brand;
  if (entry.region === 'Mexico / Caribbean') {
    brand = rng() < 0.7 ? BRANDS[5] : BRANDS[0]; // Resorts or Grand
  } else {
    const wts = [3, 6, 8, 12, 9, 1]; // distribution skews to upper-mid + select
    const total = wts.reduce((s, x) => s + x);
    let r = rng() * total;
    for (let j = 0; j < wts.length; j++) { r -= wts[j]; if (r <= 0) { brand = BRANDS[j]; break; } }
  }
  const rooms = randInt(brand.rooms[0], brand.rooms[1]);
  // City premium multiplier
  const cityPremium = ['New York','San Francisco','Aspen','Park City','Napa','Cancún','Cabo San Lucas','Key West','St. Thomas','Nassau','Oranjestad'].includes(city) ? 1.25 : 1.0;
  const adr = round2(brand.adrBase * cityPremium * rand(0.85, 1.18));
  const occupancy = round1(Math.min(94, Math.max(48, brand.occBase + rand(-9, 9))));
  const revpar = round2(adr * (occupancy / 100));
  // OTB pace vs same time last year — mostly positive but variance
  const otbPaceDelta = round1(rand(-6.5, 11.5));
  // GOPPAR
  const goppar = round2(revpar * rand(0.32, 0.46));
  // NPS
  const nps = randInt(brand.segment === 'Resort' || brand.segment === 'Luxury' ? 48 : 28, brand.segment === 'Resort' || brand.segment === 'Luxury' ? 78 : 62);

  PROPERTIES.push({
    property_id: `CH-${propId++}`,
    name: `${brand.name} ${city}`,
    brand: brand.name,
    market_segment: brand.segment,
    region: entry.region,
    city,
    state: stateCode,
    lat: round2(lat + rand(-0.04, 0.04)),
    lng: round2(lng + rand(-0.04, 0.04)),
    rooms,
    adr_usd: adr,
    occupancy_pct: occupancy,
    revpar_usd: revpar,
    goppar_usd: goppar,
    otb_pace_vs_ly_pct: otbPaceDelta,
    nps,
  });
}

// Sanity: total rooms close to 24K target — scale if needed.
const totalRooms = PROPERTIES.reduce((s, p) => s + p.rooms, 0);
const targetRooms = 24000;
const scale = targetRooms / totalRooms;
for (const p of PROPERTIES) p.rooms = Math.round(p.rooms * scale);

// ---------------------------------------------------------------------------
// Summary KPIs
// ---------------------------------------------------------------------------
const sysRooms = PROPERTIES.reduce((s, p) => s + p.rooms, 0);
const sysOcc = round1(PROPERTIES.reduce((s, p) => s + p.occupancy_pct * p.rooms, 0) / sysRooms);
const sysAdr = round2(PROPERTIES.reduce((s, p) => s + p.adr_usd * p.rooms * p.occupancy_pct, 0) /
                       PROPERTIES.reduce((s, p) => s + p.rooms * p.occupancy_pct, 0));
const sysRevpar = round2(sysAdr * (sysOcc / 100));
const sysNps = Math.round(PROPERTIES.reduce((s, p) => s + p.nps * p.rooms, 0) / sysRooms);

const loyaltyMembers = 4_820_000;

const summary = {
  generated_at: '2026-05-21T12:00:00Z',
  source: 'demo',
  as_of_date: '2026-05-21',
  kpis: [
    { label: 'Properties',          value: PROPERTIES.length, format: 'int' },
    { label: 'Rooms',               value: sysRooms, format: 'int' },
    { label: 'System RevPAR',       value: sysRevpar, format: 'currency', delta_vs_ly_pct: 4.2 },
    { label: 'System ADR',          value: sysAdr, format: 'currency', delta_vs_ly_pct: 5.7 },
    { label: 'Occupancy',           value: sysOcc, format: 'percent', delta_vs_ly_pct: -1.4 },
    { label: 'Loyalty members',     value: loyaltyMembers, format: 'int', delta_vs_ly_pct: 11.8 },
    { label: 'System NPS',          value: sysNps, format: 'int', delta_vs_ly_pct: 3 },
    { label: 'OTB pace vs LY',      value: 6.1, format: 'percent_signed' },
  ],
  top_ops_issues: [
    {
      severity: 'high',
      title: 'OTA channel mix overweight at 3 Florida resorts',
      detail: 'Booking.com share at Naples, Key West, Fort Lauderdale resorts is running 41% of summer pace vs 28% target. Commission drag ~$1.8M / quarter if not corrected.',
      property_ids: ['Naples', 'Key West', 'Fort Lauderdale'],
    },
    {
      severity: 'medium',
      title: 'Pricing agent flagged 17 properties below comp-set on shoulder dates',
      detail: 'Dynamic-pricing model recommends $14–$28 ADR lift on midweek shoulder nights. Awaiting RM approval — 9 properties have auto-accept enabled.',
    },
    {
      severity: 'medium',
      title: 'NPS dipped 4 pts at Concord Express portfolio',
      detail: 'Top complaint: front-desk wait time >7 min during 6–9pm check-in. Salesforce Service Cloud cases up 22% MoM.',
    },
  ],
};
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(OUT, 'properties.json'), JSON.stringify({ count: PROPERTIES.length, properties: PROPERTIES }, null, 2));

// ---------------------------------------------------------------------------
// Bookings — funnel + channel mix
// ---------------------------------------------------------------------------
const channels = [
  { channel: 'Brand.com direct',       share_pct: 33.2, conv_pct: 4.8,  cancel_pct: 6.1,  noshow_pct: 1.4, adr_index: 108 },
  { channel: 'Booking.com',            share_pct: 22.6, conv_pct: 2.3,  cancel_pct: 18.4, noshow_pct: 2.7, adr_index:  98 },
  { channel: 'Expedia + Hotels.com',   share_pct: 14.1, conv_pct: 2.1,  cancel_pct: 16.2, noshow_pct: 2.4, adr_index:  96 },
  { channel: 'Sabre / Amadeus GDS',    share_pct: 11.5, conv_pct: 8.7,  cancel_pct:  9.3, noshow_pct: 1.6, adr_index: 112 },
  { channel: 'Group / corporate',      share_pct:  9.8, conv_pct: 41.0, cancel_pct:  5.6, noshow_pct: 0.8, adr_index: 102 },
  { channel: 'Wholesale / FIT',        share_pct:  4.6, conv_pct: 14.0, cancel_pct:  7.2, noshow_pct: 1.9, adr_index:  82 },
  { channel: 'Voice / call center',    share_pct:  2.9, conv_pct: 22.6, cancel_pct:  5.1, noshow_pct: 1.2, adr_index: 104 },
  { channel: 'Walk-in',                share_pct:  1.3, conv_pct: 78.0, cancel_pct:  0.4, noshow_pct: 0.2, adr_index: 118 },
];

const funnel = [
  { step: 'Search sessions',           count: 41_200_000 },
  { step: 'Property page views',       count: 18_640_000 },
  { step: 'Rate shop / availability',  count:  9_120_000 },
  { step: 'Booking started',           count:  1_840_000 },
  { step: 'Booking confirmed',         count:    920_000 },
];

const bookings = {
  period_days: 90,
  channels,
  funnel,
  channel_mix_target: { 'Brand.com direct': 38, 'Booking.com': 18, 'Expedia + Hotels.com': 11 },
  notes: 'Channel mix and conversion rates aggregate the last 90 days across the 142-property portfolio. Direct-share lift is a board-level KPI.',
};
fs.writeFileSync(path.join(OUT, 'bookings.json'), JSON.stringify(bookings, null, 2));

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------
const TIERS = [
  { tier: 'Silver',   share_pct: 64.4, members: Math.round(loyaltyMembers * 0.644), adr_uplift_pct:  2.1, avg_stays_per_yr: 1.4, avg_ltv: 1_950 },
  { tier: 'Gold',     share_pct: 24.7, members: Math.round(loyaltyMembers * 0.247), adr_uplift_pct:  6.8, avg_stays_per_yr: 3.9, avg_ltv: 6_400 },
  { tier: 'Platinum', share_pct:  8.8, members: Math.round(loyaltyMembers * 0.088), adr_uplift_pct: 12.6, avg_stays_per_yr: 9.2, avg_ltv: 18_200 },
  { tier: 'Black',    share_pct:  2.1, members: Math.round(loyaltyMembers * 0.021), adr_uplift_pct: 21.4, avg_stays_per_yr: 22.6, avg_ltv: 64_800 },
];

const memberFirsts = ['Aiko','Jordan','Priya','Marcus','Sofia','Daniel','Naomi','Hiroshi','Linnea','Theo','Mei','Andre','Yusuf','Camille','Wren','Olu','Ines','Sven','Astrid','Kai'];
const memberLasts  = ['Chen','Okonkwo','Reyes','Patel','Becker','Lindqvist','Saito','Tanaka','Nakamura','Mancini','Whitfield','Iyer','Bellamy','Adeyemi','Volkov','Sato','Park','Esposito','Khoury','Halvorsen'];

const TOP_MEMBERS = Array.from({ length: 20 }, (_, i) => {
  const tier = i < 6 ? 'Black' : i < 14 ? 'Platinum' : 'Gold';
  const stays = tier === 'Black' ? randInt(34, 64) : tier === 'Platinum' ? randInt(14, 32) : randInt(8, 14);
  const ltv = tier === 'Black' ? randInt(78_000, 240_000) : tier === 'Platinum' ? randInt(24_000, 72_000) : randInt(8_500, 18_000);
  return {
    rank: i + 1,
    name: `${memberFirsts[i % memberFirsts.length]} ${memberLasts[(i * 3) % memberLasts.length]}`,
    member_id: `M-${randInt(100000, 999999)}`,
    tier,
    stays_ttm: stays,
    nights_ttm: stays * randInt(2, 5),
    lifetime_value_usd: ltv,
    pref_brand: pick(['Concord Grand', 'Concord Resorts', 'Concord']),
    home_market: pick(['New York','Los Angeles','London','Singapore','Dubai','Mexico City','São Paulo','Toronto']),
  };
});

const loyalty = {
  total_members: loyaltyMembers,
  point_liability_usd: 412_000_000,
  redemption_rate_pct: 38.4,
  active_members_ttm: 2_640_000,
  tiers: TIERS,
  top_members: TOP_MEMBERS,
  notes: 'Point liability is the actuarial value of unredeemed points (Cendyn ledger, audited annually). Black tier represents 2.1% of members but ~14% of system revenue.',
};
fs.writeFileSync(path.join(OUT, 'loyalty.json'), JSON.stringify(loyalty, null, 2));

// ---------------------------------------------------------------------------
// Revenue — BAR, comp-set, dynamic-pricing recs
// ---------------------------------------------------------------------------
const SAMPLE_PROPS = PROPERTIES.slice(0, 12);
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const bar = SAMPLE_PROPS.flatMap((p) =>
  DAYS.flatMap((day) =>
    [1, 2, 3].map((los) => ({
      property_id: p.property_id,
      property_name: p.name,
      day_of_week: day,
      length_of_stay: los,
      bar_usd: round2(p.adr_usd * (los === 1 ? 1 : los === 2 ? 0.94 : 0.88) *
                      ((day === 'Fri' || day === 'Sat') ? 1.18 : 1.0)),
    })),
  ),
);

const compset = SAMPLE_PROPS.map((p) => ({
  property_id: p.property_id,
  property_name: p.name,
  city: p.city,
  concord_adr: p.adr_usd,
  compset_median_adr: round2(p.adr_usd * rand(0.92, 1.08)),
  ari: round2(rand(0.94, 1.09)),  // ADR Rate Index vs comp
  mpi: round2(rand(0.95, 1.12)),  // Market Penetration Index (occupancy)
  rgi: round2(rand(0.93, 1.10)),  // Revenue Generation Index
}));

const pricingRecs = SAMPLE_PROPS.map((p) => {
  const lift = round2(rand(-3, 28));
  return {
    property_id: p.property_id,
    property_name: p.name,
    target_date: '2026-06-' + String(randInt(8, 27)).padStart(2, '0'),
    current_bar: p.adr_usd,
    recommended_bar: round2(p.adr_usd * (1 + lift / 100)),
    delta_pct: lift,
    rationale: lift > 12
      ? 'Compression event: convention demand + comp-set 8% above current rate.'
      : lift > 3
        ? 'Comp-set median moved up; pickup pace 11% above forecast.'
        : lift < 0
          ? 'Soft shoulder midweek; recommend price-down to defend occupancy.'
          : 'Hold — pricing within +/- 1.5% of optimal.',
    confidence: round2(rand(0.74, 0.97)),
    auto_apply: lift > 0 && lift < 18,
  };
});

const revenue = {
  bar,
  compset,
  pricing_recommendations: pricingRecs,
  pricing_agent: {
    model: 'Concord Pricing Agent v3 (gradient-boosted demand + RL price-elasticity)',
    inputs: ['gold.dim_property','gold.fact_bookings_daily','gold.fact_compset_rates','gold.fact_search_demand','gold.fact_event_calendar'],
    refresh_cadence: 'every 15 min on Snowflake / Iceberg gold layer',
    governance: 'Auto-apply gated by RM approval thresholds and dbt-tested guardrail metrics.',
  },
};
fs.writeFileSync(path.join(OUT, 'revenue.json'), JSON.stringify(revenue, null, 2));

// ---------------------------------------------------------------------------
// Guest experience — NPS, complaints, social listening
// ---------------------------------------------------------------------------
const COMPLAINT_CATEGORIES = [
  { category: 'Front-desk wait time',      share_pct: 18.4, ttr_minutes: 14, severity_avg: 2.6 },
  { category: 'Room cleanliness',          share_pct: 14.7, ttr_minutes:  9, severity_avg: 3.1 },
  { category: 'HVAC / climate control',    share_pct: 11.2, ttr_minutes: 28, severity_avg: 2.4 },
  { category: 'Wi-Fi performance',         share_pct: 10.6, ttr_minutes: 12, severity_avg: 2.0 },
  { category: 'Billing dispute',           share_pct:  9.3, ttr_minutes: 47, severity_avg: 3.4 },
  { category: 'Loyalty point credit',      share_pct:  7.8, ttr_minutes: 31, severity_avg: 2.2 },
  { category: 'Food & beverage quality',   share_pct:  7.1, ttr_minutes: 18, severity_avg: 2.7 },
  { category: 'Noise / adjacent guests',   share_pct:  5.8, ttr_minutes: 21, severity_avg: 2.5 },
  { category: 'Pool / amenity hours',      share_pct:  4.6, ttr_minutes: 16, severity_avg: 1.8 },
  { category: 'Concierge responsiveness',  share_pct:  3.9, ttr_minutes: 24, severity_avg: 2.3 },
  { category: 'Parking / valet',           share_pct:  3.4, ttr_minutes: 17, severity_avg: 2.1 },
  { category: 'Other',                     share_pct:  3.2, ttr_minutes: 22, severity_avg: 2.0 },
];

const npsByProperty = PROPERTIES.map((p) => ({
  property_id: p.property_id,
  property_name: p.name,
  brand: p.brand,
  nps: p.nps,
  responses_30d: randInt(180, 1800),
  promoters_pct: round1(50 + p.nps * 0.45 + rand(-6, 6)),
  detractors_pct: round1(Math.max(4, 28 - p.nps * 0.25 + rand(-3, 3))),
})).sort((a, b) => b.nps - a.nps);

const SOCIAL_SOURCES = ['Twitter/X','TripAdvisor','Google Reviews','Instagram','Reddit'];
const socialListening = SOCIAL_SOURCES.map((src) => ({
  source: src,
  mentions_24h: randInt(1200, 9800),
  sentiment_score: round2(rand(-0.18, 0.62)),
  share_positive_pct: round1(rand(48, 78)),
  share_negative_pct: round1(rand(10, 26)),
  top_topic: pick(['Pool experience','Loyalty redemption','Front-desk','Room upgrade','Restaurant','App / digital key','Cleanliness']),
}));

const guest_experience = {
  system_nps: sysNps,
  nps_band: { promoters_pct: 56.2, passives_pct: 27.4, detractors_pct: 16.4 },
  ttr_overall_minutes: 19,
  ttr_target_minutes: 15,
  complaint_categories: COMPLAINT_CATEGORIES,
  nps_by_property: npsByProperty.slice(0, 30),  // top 30 for the view
  nps_bottom_10: npsByProperty.slice(-10),
  social_listening: socialListening,
  recent_critical_cases: [
    { case_id: 'SC-48201', property: 'Concord Resorts Cancún', issue: 'Wedding-party noise complaint cluster', source: 'TripAdvisor', sentiment: -0.62, opened_min_ago: 38, status: 'GM-engaged' },
    { case_id: 'SC-48207', property: 'Concord Grand New York',  issue: 'Billing — duplicate folio charge',     source: 'Salesforce', sentiment: -0.41, opened_min_ago: 72, status: 'Resolved' },
    { case_id: 'SC-48214', property: 'Concord Express Houston', issue: 'HVAC repeat outage floor 7',           source: 'Salesforce', sentiment: -0.55, opened_min_ago: 24, status: 'In-progress' },
  ],
};
fs.writeFileSync(path.join(OUT, 'guest_experience.json'), JSON.stringify(guest_experience, null, 2));

// ---------------------------------------------------------------------------
// Forecast — next 90 days
// ---------------------------------------------------------------------------
const EVENTS = [
  { date: '2026-06-04', city: 'Chicago',     name: 'Sweets & Snacks Expo',        impact: 'compression', adr_lift_pct: 38 },
  { date: '2026-06-12', city: 'New Orleans', name: 'AHIA Annual Meeting',          impact: 'compression', adr_lift_pct: 22 },
  { date: '2026-06-15', city: 'Nashville',   name: 'CMA Music Festival',           impact: 'compression', adr_lift_pct: 41 },
  { date: '2026-06-19', city: 'Las Vegas',   name: 'InfoSec World',                impact: 'compression', adr_lift_pct: 28 },
  { date: '2026-06-22', city: 'Boston',      name: 'BIO International',            impact: 'compression', adr_lift_pct: 34 },
  { date: '2026-07-01', city: 'Washington',  name: 'Independence Day weekend',     impact: 'leisure',     adr_lift_pct: 18 },
  { date: '2026-07-10', city: 'San Francisco', name: 'Anime Expo overflow',        impact: 'compression', adr_lift_pct: 21 },
  { date: '2026-07-17', city: 'Atlanta',     name: 'Microsoft Inspire',            impact: 'compression', adr_lift_pct: 32 },
  { date: '2026-07-24', city: 'Cancún',      name: 'Summer leisure peak',          impact: 'leisure',     adr_lift_pct: 24 },
  { date: '2026-08-04', city: 'Denver',      name: 'Outdoor Retailer',             impact: 'compression', adr_lift_pct: 19 },
];

const forecast90 = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 4, 22);
  d.setDate(d.getDate() + i);
  const iso = d.toISOString().slice(0, 10);
  const dow = d.getDay(); // 0 Sun
  const weekend = dow === 5 || dow === 6;
  const baseOcc = 71 + (weekend ? 9 : 0) + rand(-4, 4);
  const event = EVENTS.find((e) => e.date === iso);
  const occ = round1(Math.min(96, baseOcc + (event ? 8 : 0)));
  const adr = round2(sysAdr * (1 + (event ? event.adr_lift_pct / 100 : (weekend ? 0.09 : 0)) + rand(-0.04, 0.04)));
  const revpar = round2(adr * occ / 100);
  return { date: iso, dow: DAYS[(dow + 6) % 7], occ_pct: occ, adr_usd: adr, revpar_usd: revpar, has_event: !!event };
});

const projectedRevenue = Math.round(forecast90.reduce((s, d) => s + d.revpar_usd * sysRooms, 0));

const forecast = {
  horizon_days: 90,
  generated_at: '2026-05-21T06:00:00Z',
  model: 'Snowpark XGBoost demand model + LightGBM event-overlay; trained on gold.fact_bookings_daily 2019-2026.',
  projected_revenue_usd: projectedRevenue,
  projected_revpar_avg: round2(forecast90.reduce((s, d) => s + d.revpar_usd, 0) / forecast90.length),
  daily: forecast90,
  events: EVENTS,
};
fs.writeFileSync(path.join(OUT, 'forecast.json'), JSON.stringify(forecast, null, 2));

// ---------------------------------------------------------------------------
// Pipeline — Fivetran connector + dbt layer status
// ---------------------------------------------------------------------------
const pipeline = {
  generated_at: '2026-05-21T12:00:00Z',
  connectors: [
    { name: 'Oracle Opera PMS',         type: 'PMS',             destination: 'snowflake.bronze.opera_*',     status: 'healthy', last_sync_min_ago:  4, rows_24h: 18_240_000, freshness_target_min: 10 },
    { name: 'Sabre SynXis CRS',          type: 'CRS',            destination: 'snowflake.bronze.sabre_*',     status: 'healthy', last_sync_min_ago:  6, rows_24h:  6_120_000, freshness_target_min: 10 },
    { name: 'Amadeus Hospitality',       type: 'GDS',            destination: 'snowflake.bronze.amadeus_*',   status: 'healthy', last_sync_min_ago:  8, rows_24h:  4_980_000, freshness_target_min: 15 },
    { name: 'Booking.com partner feed',  type: 'OTA',            destination: 'snowflake.bronze.booking_*',   status: 'degraded', last_sync_min_ago: 22, rows_24h:  9_460_000, freshness_target_min: 15, note: 'Vendor 429 throttling; auto-retry with backoff.' },
    { name: 'Expedia EPC',               type: 'OTA',            destination: 'snowflake.bronze.expedia_*',   status: 'healthy', last_sync_min_ago:  7, rows_24h:  7_180_000, freshness_target_min: 15 },
    { name: 'Salesforce Service Cloud',  type: 'Guest care',     destination: 'snowflake.bronze.sfdc_*',      status: 'healthy', last_sync_min_ago:  3, rows_24h:    412_000, freshness_target_min:  5 },
    { name: 'Cendyn CRM / loyalty',      type: 'CRM',            destination: 'snowflake.bronze.cendyn_*',    status: 'healthy', last_sync_min_ago:  5, rows_24h:  2_840_000, freshness_target_min: 10 },
    { name: 'Twitter/X firehose',        type: 'Social',         destination: 'snowflake.bronze.social_x_*',  status: 'healthy', last_sync_min_ago:  2, rows_24h:    980_000, freshness_target_min:  5 },
    { name: 'TripAdvisor Content API',   type: 'Reviews',        destination: 'snowflake.bronze.trip_*',      status: 'healthy', last_sync_min_ago: 11, rows_24h:    180_000, freshness_target_min: 30 },
    { name: 'Google Reviews via Places', type: 'Reviews',        destination: 'snowflake.bronze.gmaps_*',     status: 'healthy', last_sync_min_ago: 14, rows_24h:    220_000, freshness_target_min: 30 },
    { name: 'Stripe payments',           type: 'Finance',        destination: 'snowflake.bronze.stripe_*',    status: 'healthy', last_sync_min_ago:  5, rows_24h:    640_000, freshness_target_min:  5 },
    { name: 'NetSuite GL',               type: 'Finance',        destination: 'snowflake.bronze.netsuite_*',  status: 'healthy', last_sync_min_ago: 18, rows_24h:     38_000, freshness_target_min: 60 },
  ],
  layers: [
    { layer: 'bronze',   tables: 138, rows_total: 8_420_000_000, last_built_min_ago:  4, tests_passing: 184, tests_failing: 0 },
    { layer: 'silver',   tables:  64, rows_total: 2_140_000_000, last_built_min_ago: 14, tests_passing: 296, tests_failing: 1 },
    { layer: 'gold',     tables:  28, rows_total:   612_000_000, last_built_min_ago: 18, tests_passing: 184, tests_failing: 0 },
    { layer: 'platinum', tables:   9, rows_total:    18_000_000, last_built_min_ago: 22, tests_passing:  46, tests_failing: 0 },
  ],
  lineage_label: 'Fivetran',
  failure_simulator: {
    note: 'Toggle the OTA connector to "degraded" to demonstrate how Fivetran auto-recovers and how dbt freshness tests catch the drift before it hits the revenue page.',
  },
};
fs.writeFileSync(path.join(OUT, 'pipeline.json'), JSON.stringify(pipeline, null, 2));

// ---------------------------------------------------------------------------
// Iceberg tables
// ---------------------------------------------------------------------------
const icebergTables = [
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.bronze', table: 'opera_reservations', rows: 1_840_000_000, files: 12_480, size_gb:  942.0, partition: 'arrival_date_month', last_commit: '2026-05-21T11:42:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.bronze', table: 'opera_folios',       rows:   980_000_000, files:  8_120, size_gb:  410.0, partition: 'check_out_date_month', last_commit: '2026-05-21T11:44:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.bronze', table: 'booking_com_bookings', rows: 720_000_000, files:  6_240, size_gb:  286.0, partition: 'create_date_day', last_commit: '2026-05-21T11:38:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.bronze', table: 'sfdc_cases',         rows:    62_000_000, files:    980, size_gb:   28.4, partition: 'case_open_month', last_commit: '2026-05-21T11:50:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.bronze', table: 'social_x_mentions',  rows:   220_000_000, files:  3_140, size_gb:   72.1, partition: 'mention_date_day', last_commit: '2026-05-21T11:52:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.silver', table: 'reservations_clean',  rows: 1_820_000_000, files:  9_840, size_gb:  812.0, partition: 'arrival_date_month', last_commit: '2026-05-21T11:30:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.silver', table: 'guest_unified',       rows:   142_000_000, files:  2_120, size_gb:   86.2, partition: 'created_year', last_commit: '2026-05-21T11:32:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.gold',   table: 'fact_bookings_daily', rows:   178_000_000, files:  2_240, size_gb:   71.4, partition: 'stay_date_month', last_commit: '2026-05-21T11:18:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.gold',   table: 'fact_compset_rates',  rows:    62_000_000, files:    880, size_gb:   24.6, partition: 'rate_date_month', last_commit: '2026-05-21T11:20:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.gold',   table: 'dim_property',        rows:           142, files:      4, size_gb:    0.04, partition: '—', last_commit: '2026-05-21T08:00:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.gold',   table: 'dim_loyalty_member',  rows:     4_820_000, files:    120, size_gb:    4.2, partition: 'enrollment_year', last_commit: '2026-05-21T10:42:00Z' },
  { catalog: 'snowflake_horizon', namespace: 'concord_lake.gold',   table: 'fact_guest_sentiment_daily', rows: 86_000_000, files: 940, size_gb: 18.6, partition: 'sentiment_date_month', last_commit: '2026-05-21T11:24:00Z' },
];
fs.writeFileSync(path.join(OUT, 'iceberg.json'), JSON.stringify({ tables: icebergTables }, null, 2));

console.log(`Wrote synthetic data: ${PROPERTIES.length} properties, ${sysRooms} rooms.`);
