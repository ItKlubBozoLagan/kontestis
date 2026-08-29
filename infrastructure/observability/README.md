# Kontestis observability

The development Compose stack provisions Prometheus, Grafana, the Kontestis dashboard, and a
development-only RSA key pair. Browse Grafana directly at `http://localhost:3001`; the application
embeds it through `http://localhost:8080/grafana`.

Production requirements:

- Configure Prometheus to scrape `GET /metrics` with `METRICS_BEARER_TOKEN`.
- Set `GRAFANA_EMBED_ENABLED=true`, `GRAFANA_INTERNAL_URL`, `GRAFANA_PUBLIC_URL`, and
  `GRAFANA_JWT_PRIVATE_KEY_PATH` on the backend.
- Configure Grafana's subpath-aware root URL, embedding, and JWT auth using the matching public
  key and the `X-Kontestis-Grafana-JWT` header. Require the `kontestis` issuer and `grafana`
  audience. Embedded users must land in a dedicated Grafana organisation or instance that exposes
  only the intended dashboard and Prometheus data source.
- Keep the Grafana upstream private; browsers should reach it only through the authenticated
  Kontestis proxy.

## ELO cutover

Deploy the ELO-history migration while the legacy InfluxDB remains reachable. New recomputations
write Scylla immediately and no application request depends on InfluxDB.

Run the importer first without `--write`, then persist it with a checkpoint:

```sh
pnpm --filter @kontestis/scripts elo-history-backfill --checkpoint=elo-history.json
pnpm --filter @kontestis/scripts elo-history-backfill --write --checkpoint=elo-history.json
```

The command uses `DB_HOST`, `DB_PORT`, `DB_DATACENTER`, `DB_KEYSPACE`, and the four legacy
`INFLUXDB_*` connection variables. It is idempotent and records a reconciliation event so imported
history terminates at the absolute Scylla ELO.

Audit contests whose application state could not be inferred after legacy Influx failures:

```sh
pnpm --filter @kontestis/scripts elo-history-audit
pnpm --filter @kontestis/scripts elo-history-audit --write --contest=123 --action=mark-applied
pnpm --filter @kontestis/scripts elo-history-audit --write --contest=123 --action=recompute
```

Choose the action from production evidence; the application intentionally never guesses. Remove
or decommission InfluxDB only after the importer report, profile graphs, and pending-contest audit
have been reviewed.
