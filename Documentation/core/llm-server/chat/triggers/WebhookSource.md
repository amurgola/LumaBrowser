# WebhookSource

`core/llm-server/chat/triggers/WebhookSource.js`

The inbound `/hooks/<token>` webhook receiver: an Express router that turns a
POST to a trigger's URL into a sample capture or a trigger run.

## Methods

- `new WebhookSource({ triggerStore, runner, emitEvent?, resultWaitMs?, secrets? })`
  throws `WebhookSource needs triggerStore + runner` without both.
  `triggerStore` is a [TriggerStore](../TriggerStore.md); `runner` needs
  `fire(triggerId, event, { kind, dedupeKey, source, remote })` returning
  `{ accepted, reason?, done, deferred?, batched?, ... }`; `secrets` is
  `{ get(id) }` ([TriggerSecrets](TriggerSecrets.md)) or `null`; `emitEvent(type,
  payload)` receives `delivery`, `rejected`, `handshake`, `sample-captured` and
  `triggers-changed`.
- `router()` returns the Express router (built once). Mount it at `/hooks`.
- Statics: `BODY_LIMIT` (`'1mb'`), `RATE_PER_MIN` (60), `LOCKOUT_FAILS` (10),
  `LOCKOUT_WINDOW_MS` (10 min), `RESULT_WAIT_MS` (25 s).

## Routes

| Route | Answer |
|---|---|
| any `/:token` that fails the shape check, is unknown, or comes from a locked-out IP | 404 `Not found` (text) |
| `GET /:token/runs/:runId` | `{ runId, status, response, error, completedAt }`, 404 for a run of another trigger |
| `POST`, `PUT`, `PATCH /:token` | a delivery, see [WebhookDelivery](webhook/WebhookDelivery.md) |
| any other method on `/:token` | 405 `{ error: 'send a POST' }` |

Bodies over 1 MB are refused with 413 before any handler runs.

## Why

The token is the credential (the share-link pattern). The token gate checks
`TriggerStore.HOOK_TOKEN_RE` before any lookup and answers every failure with
the same 404, and an IP that sent `LOCKOUT_FAILS` bad tokens (or bad
signatures) within `LOCKOUT_WINDOW_MS` gets 404 even for a valid token, so
nothing can probe which tokens exist.

The router is mounted on both the REST gateway (always on, for local senders and
user-run tunnels; see `rawBodyPrefixes` in [RestGateway](../../../shell/RestGateway.md))
and the Network Sharing web backend (the surface with a public URL). Both hosts
skip their JSON parsers for `/hooks`, so this router reads raw bytes: signature
verification needs them, and many senders post forms or plain text.

It does not extend [TriggerSource](TriggerSource.md): it is not subscribed to an
upstream that appears later, each request already names exactly one trigger,
and it calls the runner's `fire` (whose answer becomes the HTTP reply) rather
than `deliver`.
