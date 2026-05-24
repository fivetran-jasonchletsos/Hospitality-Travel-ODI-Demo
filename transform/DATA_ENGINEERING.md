# Transform — Hospitality-Travel-ODI-Demo

dbt project that builds the four-layer medallion on Snowflake + Apache
Iceberg for Concord Hotels.

## Layers

| Layer    | Purpose                                                      | Tables | Materialization |
|----------|--------------------------------------------------------------|--------|-----------------|
| bronze   | Raw lands from Fivetran. Schema-as-is. No business logic.    | 138    | view            |
| silver   | Conformed dimensions, deduplication, identity resolution.    | 64     | incremental     |
| gold     | Facts and KPIs. RevPAR, ADR, occupancy, NPS — defined once.  | 28     | iceberg table   |
| platinum | Agent-ready feature tables. Reverse-ETL targets.             | 9      | iceberg table   |

## Key gold models

| Model                              | Grain                          | Source silver models                      |
|------------------------------------|--------------------------------|-------------------------------------------|
| `gold.dim_property`                | Property                       | `silver.property_master`                  |
| `gold.dim_loyalty_member`          | Member                         | `silver.member_master`, `silver.guest_unified` |
| `gold.fact_bookings_daily`         | Property × Stay date           | `silver.reservations_clean`               |
| `gold.fact_channel_mix`            | Property × Stay date × Channel | `silver.ota_bookings_unified`, `silver.reservations_clean` |
| `gold.fact_compset_rates`          | Property × Rate date           | `silver.compset_rates_clean`              |
| `gold.fact_event_calendar`         | City × Date                    | `silver.event_master`                     |
| `gold.fact_service_cases`          | Case                           | `silver.cases_clean`                      |
| `gold.fact_guest_sentiment_daily`  | Property × Date × Source       | `silver.sentiment_normalized`             |

## Platinum (agent-ready)

| Model                              | Consumer                                |
|------------------------------------|-----------------------------------------|
| `platinum.agent_pricing_features`  | Concord Pricing Agent (Snowpark)        |
| `platinum.agent_pricing_recs`      | Pricing Agent output, audited           |
| `platinum.agent_guest_360`         | Guest experience agent on the gold layer |
| `platinum.agent_demand_signals`    | Forecast model                          |

## Identity resolution

`silver.guest_unified` performs the cross-source identity merge:

1. **Deterministic match**: Opera `loyalty_id` ↔ Cendyn `member_id`.
2. **Email + phone match**: hashed, lowercased, country-coded.
3. **Probabilistic match**: name + birth year + market with confidence ≥ 0.92.
4. **Surrogate key**: `guest_uid` (UUID v5 over the merge key set).

dbt tests guarantee:
- `guest_uid` is unique.
- Every `gold.fact_bookings_daily` row attributes to a `guest_uid`
  (coverage ≥ 99.7%).
- No two Cendyn `member_id`s collide on the same `guest_uid`.

## RevPAR — defined once

```sql
-- gold.fact_bookings_daily
select
  property_id,
  stay_date,
  sum(room_revenue_usd)                          as room_revenue,
  sum(rooms_sold)                                as rooms_sold,
  any_value(rooms_available)                     as rooms_available,
  sum(room_revenue_usd) / nullif(any_value(rooms_available), 0) as revpar,
  sum(room_revenue_usd) / nullif(sum(rooms_sold), 0)            as adr,
  sum(rooms_sold)       / nullif(any_value(rooms_available), 0) as occupancy
from {{ ref('silver_reservations_clean') }}
group by property_id, stay_date
```

The dashboard reads `revpar`. The pricing agent reads `revpar`. They cannot disagree.

## Tests

| Test type           | Count |
|---------------------|-------|
| Uniqueness          | 184   |
| Not-null            | 296   |
| Referential         | 142   |
| Freshness           |  62   |
| Accepted values     |  48   |
| Custom dbt-expectations | 96 |
| **Total**           | **710** |

## Run

```bash
cd transform
dbt deps
dbt run --target prod
dbt test --target prod
```
