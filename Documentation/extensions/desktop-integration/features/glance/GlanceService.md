# GlanceService

`extensions/desktop-integration/features/glance/GlanceService.js`

Builds the [glance](index.md) summary: runs each enabled provider of
[GlanceProviders](GlanceProviders.md) against `deps.extensions`, fits their
segments into one line with [GlanceText](GlanceText.md), and joins their
tooltip lines under a `Luma` heading.

- `new GlanceService(deps, { providers?, now? })`: `providers` and `now()` are
  test seams.
- `get({ fresh })` -> `{ generatedAt, ttlSeconds, line, lines, tooltip, items, providers }`.
  Cached for `CACHE_MS` (10 s); concurrent calls share one build; `fresh`
  skips the cache.
- `invalidate()`: drops the cache (settings changed, feature disposed).
- `settings()`: the effective settings, `DEFAULTS` filled in and clamped
  (`maxLineLength` 8 to 200, `timeFormat` `12h` or `24h`).
- A provider whose extension is missing is listed with `available: false`; one
  that throws is listed with its `error` and logged; the others still answer.
- `TTL_SECONDS` (30) is the poll interval suggested to clients.
