# SiteApiSchema

`extensions/site-apis/SiteApiSchema.js`

Creates the three Site APIs tables and recovers runs the app closed during.

## Tables

- `site_api_sites`: id (slug), name, origin, partition, start_url, login (JSON), status (`ok` / `signed_out` /
  `unknown`), status_note, conversation_id (the builder chat), timestamps.
- `site_api_endpoints`: id, site_id, name (unique per site), description, params / steps / returns / policy
  (JSON), status (`draft` / `validated` / `broken`), last_run (JSON summary), timestamps.
- `site_api_runs`: id, endpoint_id, site_id, kind (`call` / `test`), params, status (`running` / `ok` / `failed`),
  fault, result, steps_log (JSON), duration_ms, started_at, finished_at; indexed by endpoint and start time.

## Methods

- `ensure(db)`: creates the tables and index, applies `ADDED_COLUMNS` (empty today; each ALTER that already
  applied is skipped), and marks every `running` run `failed` with an `aborted` fault.
