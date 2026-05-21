# Connectors — Hospitality-Travel-ODI-Demo

Fivetran connectors landing every Concord Hotels source system into the
managed Iceberg lake on Snowflake. Bronze namespace per source; dbt
silver / gold consume downstream.

| Source                          | Type            | Auth                | Headline tables                                    | Incremental key |
|---------------------------------|-----------------|---------------------|----------------------------------------------------|-----------------|
| Oracle Opera PMS                | PMS             | Service account     | reservations, folios, room_status, group_blocks    | `last_modified` |
| Sabre SynXis CRS                | CRS             | OAuth2              | inventory, rates, gds_bookings                     | `update_ts` |
| Amadeus Hospitality             | GDS             | OAuth2              | compset_rates, gds_inventory                       | `update_ts` |
| Booking.com partner feed        | OTA             | Partner API key     | bookings, cancellations, commissions               | `booking_event_ts` |
| Expedia EPC                     | OTA             | Partner API key     | bookings, cancellations, commissions               | `booking_event_ts` |
| Salesforce Service Cloud        | Guest care      | OAuth2              | cases, case_history, nps_responses                 | `system_modstamp` |
| Cendyn CRM / loyalty            | CRM             | API key             | members, points_ledger, segments                   | `updated_at` |
| Twitter/X firehose              | Social          | OAuth2 bearer       | mentions                                           | `mention_ts` |
| TripAdvisor Content API         | Reviews         | API key             | reviews, ratings                                   | `review_date` |
| Google Reviews via Places       | Reviews         | API key             | reviews                                            | `review_date` |
| Stripe payments                 | Finance         | API key             | charges, refunds, balance_txns                     | `created` |
| NetSuite GL                     | Finance         | TBA                 | gl_journal, gl_accounts                            | `last_modified` |

## ODI mapping

| Source                | Bronze namespace               | dbt silver model              | dbt gold model              |
|-----------------------|--------------------------------|-------------------------------|-----------------------------|
| Oracle Opera          | `concord_lake.bronze.opera_*`  | `silver.reservations_clean`   | `gold.fact_bookings_daily`  |
| Sabre / Amadeus       | `concord_lake.bronze.sabre_*`  | `silver.compset_rates_clean`  | `gold.fact_compset_rates`   |
| Booking.com / Expedia | `concord_lake.bronze.booking_*`| `silver.ota_bookings_unified` | `gold.fact_channel_mix`     |
| Salesforce            | `concord_lake.bronze.sfdc_*`   | `silver.cases_clean`          | `gold.fact_service_cases`   |
| Cendyn                | `concord_lake.bronze.cendyn_*` | `silver.member_master`        | `gold.dim_loyalty_member`   |
| Social / Reviews      | `concord_lake.bronze.social_*` | `silver.sentiment_normalized` | `gold.fact_guest_sentiment_daily` |

## Identity resolution

`silver.guest_unified` is the deterministic + probabilistic merge of
Opera guest profiles, Cendyn loyalty IDs, OTA emails, and Salesforce
contacts into a single `guest_uid`. Every downstream gold model joins
on it. dbt tests guarantee no duplicate `guest_uid` and ≥ 99.7%
attribution coverage on bookings.

## Freshness SLAs

| Tier      | Target          | Examples                                           |
|-----------|-----------------|----------------------------------------------------|
| Real-time | ≤ 5 minutes     | Salesforce cases, Stripe charges, social mentions |
| Near-real | ≤ 10 minutes    | Opera PMS, Cendyn loyalty                          |
| Standard  | ≤ 15 minutes    | Sabre CRS, OTA partner feeds                       |
| Slow      | ≤ 60 minutes    | NetSuite GL, TripAdvisor / Google Reviews         |

Fivetran auto-retries 429s with exponential backoff. If a source
exceeds its freshness SLA, the dbt `freshness` test fires before stale
data reaches the revenue dashboard or the pricing agent.
