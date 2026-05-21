export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="eyebrow mb-1">Policy Brief</div>
        <h1 className="font-serif text-4xl tracking-tight">Why hospitality data is broken.</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          A briefing for the executive team. Six paragraphs. No marketing.
        </p>
      </header>

      <article className="prose space-y-6 text-[var(--ink)] leading-relaxed">
        <Section title="The five-system problem">
          A modern hotel runs on at least five disconnected systems. A Property Management System
          (Opera) owns the reservation and the folio. A Central Reservation System (Sabre SynXis)
          owns availability and rate distribution. A Revenue Management System owns the price.
          A CRM (Cendyn) owns the loyalty profile. OTAs (Booking.com, Expedia) own a third of the
          demand and emit booking events out of order. None of them share a guest key. None of
          them agree on what "rooms sold" means at the same minute.
        </Section>

        <Section title="The consequence">
          Every executive question becomes a three-week reconciliation. <em>"What did we make from
          our top 1,000 loyalty members last quarter?"</em> requires joining Opera, Cendyn,
          Stripe, and OTA commission ledgers — across schemas that change without notice. The
          answer ships in a deck. The deck is stale before it's emailed. A pricing agent trained
          on that mess inherits the mess.
        </Section>

        <Section title="What Open Data Infrastructure changes">
          Fivetran connectors land every system into one Snowflake account on Apache Iceberg
          tables. dbt resolves the guest identity in the silver layer, defines RevPAR exactly
          once in the gold layer, and tests every assumption. The pricing agent reads gold. The
          CCO dashboard reads gold. They cannot disagree because they read the same physical
          files. Storage is open: any compute engine — Snowflake, Athena, Trino, Spark, DuckDB —
          can join the workload without re-ingestion.
        </Section>

        <Section title="What this demo deliberately does not do">
          It does not replace Opera. It does not replace Sabre. It does not replace the RMS. It
          replaces the spreadsheets and the warehouse copies and the screenshots in slide decks
          that sit between those systems and a decision. Source systems stay sources. Concord
          owns the gold layer that every consumer reads — humans and agents.
        </Section>

        <Section title="Two roles, one substrate">
          The Chief Customer Officer wants the guest. The VP of Revenue Management wants the
          price. Historically these are two stacks built by two teams over two years. On ODI,
          they are two views of the same gold tables. When the CCO sees a complaint surge at
          Concord Express Houston, the same case data is one feature in the pricing agent's
          demand model — the agent learns from friction the CCO is also reading about.
        </Section>

        <Section title="The bet">
          The next generation of hospitality tooling will be built by AI agents reading governed
          data — not humans clicking through warehouse copies. ODI is the substrate that lets
          those agents read tables a chief customer officer or a revenue VP would also stake
          their quarter on. That is the only standard that matters.
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-3">{title}</h2>
      <p className="text-[var(--ink-muted)] leading-relaxed">{children}</p>
    </section>
  );
}
