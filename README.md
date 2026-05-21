# Hospitality-Travel-ODI-Demo

ODI demo for the hospitality & travel industry. Concord Hotels — a
fictional 142-property hotel group with ~24,000 rooms across the
Americas — built on Fivetran Open Data Infrastructure.

**Live**: https://fivetran-jasonchletsos.github.io/Hospitality-Travel-ODI-Demo/

## Audience

- **Chief Customer Officer** — guest experience, NPS, social listening, loyalty.
- **VP, Revenue Management** — BAR by LOS × DOW, comp-set positioning, dynamic-pricing agent.

## Architecture

Sources → Fivetran → Snowflake + Apache Iceberg → dbt (bronze / silver / gold / platinum) → humans + pricing agents.

| Layer       | Stack |
|-------------|-------|
| Sources     | Oracle Opera PMS · Sabre SynXis CRS · Amadeus · Booking.com · Expedia · Salesforce Service Cloud · Cendyn CRM · Twitter/X · TripAdvisor · Google Reviews · Stripe · NetSuite |
| Ingest      | Fivetran (12 connectors, CDC streaming) |
| Storage     | Snowflake account, `concord_lake` Iceberg catalog |
| Transform   | dbt — 710 tested models across four medallion layers |
| Compute     | Snowflake + Snowpark for pricing agent |
| Frontend    | React 19 + Vite + Tailwind v4, static SPA on GitHub Pages |

See [`connectors/README.md`](./connectors/README.md) and [`transform/DATA_ENGINEERING.md`](./transform/DATA_ENGINEERING.md).

## Local dev

```bash
cd concord-app/frontend
npm install
node scripts/generate_data.mjs   # regenerate synthetic snapshots
npm run dev                       # http://localhost:5173
```

## Build

```bash
cd concord-app/frontend
npm run build
```

GitHub Pages deploy is wired via `.github/workflows/deploy.yml` and
fires on push to `main` whenever `concord-app/**` changes.

## Disclaimer

All data is synthetic. Concord Hotels is a fictional brand. This site
demonstrates the ODI reference architecture for hospitality.
