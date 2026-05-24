export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="eyebrow mb-1">ODI Reference Architecture</div>
        <h1 className="font-serif text-4xl tracking-tight">From PMS to pricing agent in one lake.</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Hospitality data is famously fragmented: PMS, CRS, RMS, CRM, OTAs, loyalty, and social
          live in separate systems with separate schemas and incompatible guest keys. ODI lands
          every source into one open lake, dbt resolves the guest identity, and humans and pricing
          agents read the same gold tables.
        </p>
      </header>

      {/* Layer diagram */}
      <section className="research-card overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-[var(--hairline-soft)]">
          <div className="eyebrow">Layers</div>
          <h2 className="font-serif text-2xl">Sources → Fivetran → Snowflake + Iceberg → dbt → Consumers</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 text-sm">
          <Column tone="bronze" title="Sources" items={SOURCES} />
          <Column tone="teal" title="Fivetran" items={['750+ connectors','Managed Data Lake Service','CDC streaming','Schema evolution','Failure auto-recovery']} />
          <Column tone="silver" title="Open Lake" items={['Snowflake account','Apache Iceberg v2','ardmore_lake catalog','bronze · silver · gold · platinum','Snowflake Horizon catalog']} />
          <Column tone="gold" title="dbt" items={['710 models tested','bronze cleansing','silver conformed dims','gold facts + KPIs','platinum agent-ready']} />
          <Column tone="platinum" title="Consumers" items={['CCO + RM dashboards (this app)','Pricing Agent (Snowpark)','Tableau / Looker','Agents on the gold layer','Reverse-ETL → Salesforce']} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <div className="research-card p-6">
          <div className="eyebrow mb-2">Identity resolution</div>
          <h3 className="font-serif text-2xl text-[var(--ink-strong)]">One guest, one key.</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
            Opera PMS uses a property-scoped guest ID. Cendyn loyalty uses a member ID. OTA
            bookings arrive with email only. dbt's silver layer reconciles them into
            <code className="mx-1 px-1.5 py-0.5 bg-[var(--ivory-deep)] rounded text-[12px] font-mono">silver.guest_unified</code>
            on a deterministic + probabilistic match — surrogate key
            <code className="mx-1 px-1.5 py-0.5 bg-[var(--ivory-deep)] rounded text-[12px] font-mono">guest_uid</code>
            that every downstream model uses. The pricing agent and the CCO see the same guest.
          </p>
        </div>
        <div className="research-card p-6">
          <div className="eyebrow mb-2">Pricing-agent governance</div>
          <h3 className="font-serif text-2xl text-[var(--ink-strong)]">Agents read gold. Period.</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
            The Ardmore Pricing Agent is a Snowpark job that reads exclusively from
            three gold tables — daily bookings, comp-set rates, and the event calendar.
            Recommendations write to{' '}
            <code className="mx-1 px-1.5 py-0.5 bg-[var(--ivory-deep)] rounded text-[12px] font-mono">platinum.agent_pricing_recs</code>{' '}
            with confidence scores. Auto-apply is gated by a dbt-tested guardrail set and a human RM
            approval threshold. No agent talks to a raw source system.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Why this matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="research-card p-5">
              <div className="layer-chip gold mb-2">{p.tag}</div>
              <div className="font-serif text-xl text-[var(--ink-strong)] leading-tight">{p.title}</div>
              <p className="mt-1 text-[var(--ink-muted)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Column({ tone, title, items }: { tone: 'bronze' | 'silver' | 'gold' | 'teal' | 'platinum'; title: string; items: string[] }) {
  return (
    <div className="border-b lg:border-b-0 lg:border-r border-[var(--hairline-soft)] last:border-r-0">
      <div className="px-4 py-3 border-b border-[var(--hairline-soft)] bg-[var(--ivory-deep)]/40">
        <div className={`layer-chip ${tone === 'platinum' ? 'platinum' : tone === 'teal' ? 'gold' : tone}`}>{title}</div>
      </div>
      <ul className="px-4 py-3 space-y-1.5 text-[var(--ink-muted)] text-[13px]">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--brass)] shrink-0" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SOURCES = [
  'Oracle Opera PMS',
  'Sabre SynXis CRS',
  'Amadeus Hospitality',
  'Booking.com partner feed',
  'Expedia EPC',
  'Salesforce Service Cloud',
  'Cendyn CRM / loyalty',
  'Twitter/X firehose',
  'TripAdvisor Content API',
  'Google Reviews',
  'Stripe payments',
  'NetSuite GL',
];

const PRINCIPLES = [
  { tag: 'Open', title: 'No exit cost', body: 'Iceberg means tomorrow\'s engine can read today\'s files. Ardmore owns the data — Fivetran writes, dbt transforms, anyone reads.' },
  { tag: 'Governed', title: 'One semantic layer', body: 'RevPAR is defined once in dbt. The agent and the dashboard cannot disagree because they read the same gold table.' },
  { tag: 'Real-time enough', title: 'Minutes, not days', body: 'CDC syncs in 4–10 minutes. Snowflake materializes silver every 15. A folio dispute opens a case before the guest reaches the lobby.' },
];
