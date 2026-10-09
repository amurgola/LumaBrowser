# CalendarService

`extensions/personal-hub/calendar/CalendarService.js`

The Hub's calendar operations: the user's calendar sources, the merged event
view the agenda widget and the `hub_*` tools read, one source's sync through
its provider, and the OAuth sign-in of Google and Microsoft sources. Kinds:
`ics`, `google-session` (the signed-in browser session, no sign-in step),
`google` and `microsoft` (OAuth).

## Construction

`new CalendarService({ sources, events, secrets, providers, oauth, tokens, emit, getRedirectUri, fetchImpl, now })`

- `sources`: [CalendarSourceRepository](CalendarSourceRepository.md);
  `events`: [CalendarEventRepository](CalendarEventRepository.md).
- `secrets`: a TriggerSecrets-like store (`get/set/delete/has` over strings);
  client secrets live under `hub:cal:<sourceId>:clientSecret`.
- `providers`: `{ kind: CalendarProvider }`; `oauth`: an [OAuthFlow](oauth/OAuthFlow.md);
  `tokens`: an [OAuthTokens](oauth/OAuthTokens.md).
- `emit(type, payload)`: the Hub's broadcast; `getRedirectUri()`: the gateway's
  `/api/hub/oauth/callback` URL at call time (the port is known late).

## Methods

- `listSources()` / `getSource(id)`: sources with `clientSecret` stripped from
  `config`, plus `connected` (true for ICS, else whether tokens exist),
  `hasClientSecret` and `eventCount`.
- `dueSources(nowIso)`: raw rows due for a sync (for the scheduler).
- `addSource({ kind, label, color, config, intervalMs })`: validates through the
  provider, stores the client secret in `secrets` (never in the row), clamps the
  interval to 5 min..24 h (default 15 min), emits `calendar.changed`.
- `updateSource(id, { label, color, enabled, intervalMs, config })`: `config`
  is merged; a `clientSecret` inside is re-stored and removed.
- `removeSource(id)`: deletes the events, tokens and secret with the row.
- `listEvents({ from, to, days = 14, sourceIds })`: events joined with
  `sourceLabel`, `sourceColor`, `sourceKind`; `from` defaults to the start of
  today (local).
- `async syncSource(sourceOrId)` -> `{ sourceId, status: 'ok' | 'error', count, error }`:
  fetches `[now - 30 days, now + 120 days]`, replaces the source's events in one
  transaction, records the outcome and the next sync time either way, emits
  `calendar.synced`. Never throws.
- `startOAuth(sourceId)` -> `{ success, url }`: the consent URL for a Google or
  Microsoft source (the caller opens it in a tab).
- `async completeOAuth(state, code, error)`: the callback; on success the
  source is due at once and `calendar.changed { connected: true }` is emitted.
- `describeSources()`: one line per source for tool replies.

## Why

Secrets and tokens never ride a source row: rows are listed to the renderer,
the Dashboard and tools, and `listSources` is the only reader surface. A failed
sync still reschedules so one bad feed cannot stall the loop, and it keeps the
previous events rather than wiping the calendar.
