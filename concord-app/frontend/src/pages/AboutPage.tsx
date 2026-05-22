export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Canonical ODI Story block — copied verbatim from FinServ AboutPage,
          rendered with the hospitality palette. Non-negotiable. */}
      <section className="research-card p-6 mb-10" style={{ borderColor: 'var(--brass)' }}>
        <div className="eyebrow mb-2" style={{ color: 'var(--brass-dim)' }}>The ODI Story</div>
        <h2 className="font-serif text-3xl tracking-tight text-[var(--ink-strong)]">
          Data infrastructure for agents you trust.
        </h2>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          <em>"MDS was optimized for humans. ODI is designed for a future with humans and
          production agents at scale."</em> This demo is one instance of that architecture:
          Fivetran's 750+ connectors and Managed Data Lake Service (MDLS) land data into open
          table formats; dbt transformations build the governed semantic layer; multiple compute
          engines and AI agents read the same gold tables.
        </p>
        <a
          href="https://fivetran-jasonchletsos.github.io/Fivetran-Demo-Repository/story/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: 'var(--brass-dim)' }}
        >
          Read the full ODI Story →
        </a>
      </section>

      <header className="mb-8">
        <div className="eyebrow mb-1">ODI Reference Architecture</div>
        <h1 className="font-serif text-4xl tracking-tight">About Ardmore Hotels</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          Ardmore Hotels is a reference build that shows how a premium-mid-tier hotel group
          unifies fragmented hospitality data — Oracle Opera PMS, Sabre / Amadeus, Booking.com,
          Expedia, Salesforce Service Cloud, Cendyn CRM, and social listening — into one governed
          Snowflake + Apache Iceberg gold layer. Revenue managers and pricing agents read the
          same tables. dbt builds the semantic layer. Fivetran lands the data.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">What this demo shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="research-card p-5">
              <div className="layer-chip gold inline-flex mb-3">{p.tag}</div>
              <h3 className="font-serif text-xl text-[var(--ink-strong)]">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Audience</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="research-card p-5">
            <div className="eyebrow mb-2">Chief Customer Officer</div>
            <h3 className="font-serif text-xl text-[var(--ink-strong)]">One view of the guest</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
              NPS, complaints, social sentiment, and loyalty behavior in one place. Cases routed
              by severity. Black-tier guests recognized at every touchpoint. Friction surfaced
              within minutes of the signal.
            </p>
          </div>
          <div className="research-card p-5">
            <div className="eyebrow mb-2">VP, Revenue Management</div>
            <h3 className="font-serif text-xl text-[var(--ink-strong)]">Pricing on the same gold layer</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
              BAR by property, length of stay, and day of week. Comp-set positioning live from
              Sabre / Amadeus. Dynamic-pricing recommendations from the Ardmore Pricing Agent,
              governed by dbt-tested guardrails and a human-in-the-loop approval threshold.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Tech stack</h2>
        <div className="research-card p-5">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {STACK.map((s) => (
              <li key={s.name} className="flex items-start gap-3">
                <div className="layer-chip silver shrink-0 mt-0.5">{s.layer}</div>
                <div className="min-w-0">
                  <div className="font-serif text-base text-[var(--ink-strong)]">{s.name}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{s.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Data sources</h2>
        <div className="space-y-3">
          {DATA_SOURCES.map((s) => (
            <article key={s.title} className="research-card p-5">
              <div className="flex items-start gap-3">
                <span className="status-pill brass shrink-0">Source</span>
                <div className="min-w-0">
                  <h3 className="font-serif text-xl text-[var(--ink-strong)]">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{s.description}</p>
                  <div className="mt-2 text-xs text-[var(--ink-soft)]">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Provides:</span> {s.provides}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">ODI vs MDS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="research-card p-5">
            <div className="eyebrow mb-2">Traditional MDS</div>
            <h3 className="font-serif text-xl text-[var(--ink-strong)]">Warehouse-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
              <li>• Single proprietary warehouse owns storage <em>and</em> compute</li>
              <li>• Data exits via expensive egress / replication</li>
              <li>• Compute engine choice locked to vendor roadmap</li>
              <li>• Customer pays for storage twice (lake + warehouse)</li>
              <li>• Schema evolution is vendor-managed</li>
            </ul>
          </div>
          <div className="research-card p-5" style={{ borderColor: 'var(--brass)' }}>
            <div className="eyebrow mb-2" style={{ color: 'var(--brass-dim)' }}>Open Data Infrastructure</div>
            <h3 className="font-serif text-xl text-[var(--ink-strong)]">Open lake-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <li>• Ardmore owns the storage layer (Snowflake + Iceberg)</li>
              <li>• Any compute engine — Snowflake, Athena, Trino, Spark, DuckDB</li>
              <li>• Catalog is open (Snowflake Horizon / Glue / Polaris)</li>
              <li>• Pay once for storage; swap compute as workloads evolve</li>
              <li>• Schema evolution is in the Iceberg spec, vendor-neutral</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-sm bg-[var(--ivory-deep)] border border-[var(--hairline)] p-5 text-sm text-[var(--ink)]">
        <div className="eyebrow mb-2" style={{ color: 'var(--warn)' }}>Disclaimer</div>
        <p className="text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--ink-strong)]">All data shown is synthetic</strong> and
          generated for this demo. Ardmore Hotels is a fictional hotel group. No portion of this
          site reflects the operating data of any real hospitality brand.
        </p>
      </section>
    </div>
  );
}

const PILLARS = [
  {
    tag: 'Pillar 1',
    title: 'Customer-owned storage',
    body: 'All ingested data lands in Ardmore\'s Snowflake account on Iceberg tables. Fivetran writes; Ardmore reads with any engine.',
  },
  {
    tag: 'Pillar 2',
    title: 'Open table format',
    body: 'Iceberg v2 provides ACID transactions, schema evolution, time-travel, and partition evolution — no vendor lock-in on table layout.',
  },
  {
    tag: 'Pillar 3',
    title: 'Any compute engine',
    body: 'Snowflake SQL queries the same files dbt writes. Pricing agent reads them via Snowpark. Athena and Trino are one-line additions.',
  },
];

const STACK = [
  { layer: 'Ingest',     name: 'Fivetran',                       note: 'Oracle Opera · Sabre · Amadeus · Booking.com · Expedia · Salesforce · Cendyn · social APIs.' },
  { layer: 'Storage',    name: 'Snowflake + Apache Iceberg v2',  note: 'ardmore_lake catalog — bronze · silver · gold · platinum namespaces.' },
  { layer: 'Catalog',    name: 'Snowflake Horizon',              note: 'Iceberg REST + object-level access control · row-level policy on guest PII.' },
  { layer: 'Transform',  name: 'dbt',                            note: 'Iceberg-native materializations · 710 tested models · medallion architecture.' },
  { layer: 'Compute',    name: 'Snowflake + Snowpark',           note: 'Pricing agent runs inside the warehouse next to the data.' },
  { layer: 'Frontend',   name: 'React 19 + Vite + Tailwind v4',  note: 'Static SPA on GitHub Pages, reads JSON snapshot.' },
  { layer: 'Charts',     name: 'Recharts',                       note: 'Forecast curves, channel mix, NPS distribution.' },
  { layer: 'BI',         name: 'dbt Semantic Layer + Tableau',   note: 'KPIs defined once; consumed by humans and agents.' },
];

const DATA_SOURCES = [
  {
    title: 'Oracle Opera PMS',
    description: 'Property management system of record at all 142 properties. Reservations, folios, room status, group blocks, in-stay activity. Fivetran lands the change-data-capture stream into Snowflake bronze every 4–10 minutes.',
    provides: 'Reservations · folios · room nights · in-stay activity · housekeeping status',
  },
  {
    title: 'Sabre SynXis CRS + Amadeus Hospitality',
    description: 'Central reservation system and GDS feeds. Rates, inventory, comp-set pricing, GDS bookings from the travel agent channel. The pricing agent reads comp-set positioning here.',
    provides: 'BAR · inventory · comp-set median rates · GDS bookings',
  },
  {
    title: 'Booking.com & Expedia partner feeds',
    description: 'OTA channel mix dominates the funnel. Fivetran ingests booking events, cancellations, and commission ledgers so the revenue team can see true net-net contribution.',
    provides: 'OTA bookings · cancellations · commissions · channel mix',
  },
  {
    title: 'Salesforce Service Cloud',
    description: 'Guest care case management. Tied to the loyalty profile so a Black-tier guest opening a case routes to a senior agent within 60 seconds. NPS surveys feed in here too.',
    provides: 'Cases · NPS responses · case routing · escalations',
  },
  {
    title: 'Cendyn CRM + loyalty',
    description: 'The 4.82M-member loyalty program ledger. Points balance, tier status, redemption history, and the actuarial point liability that the audit committee reviews quarterly.',
    provides: 'Member ledger · tier · points liability · marketing audience',
  },
  {
    title: 'Social listening (Twitter/X, TripAdvisor, Google Reviews)',
    description: 'Public sentiment streams normalized to property. A vendor-side throttle on Booking.com triggers a freshness alert in the pipeline; a sentiment cluster on TripAdvisor routes to the property GM.',
    provides: 'Mentions · sentiment score · topic tagging · property attribution',
  },
];
