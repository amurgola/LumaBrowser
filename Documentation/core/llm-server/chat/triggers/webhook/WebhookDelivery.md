# WebhookDelivery

`core/llm-server/chat/triggers/webhook/WebhookDelivery.js`

Handles one webhook delivery to a trigger the token gate already found. Used by
[WebhookSource](../WebhookSource.md).

## Methods

- `new WebhookDelivery({ triggerStore, runner, secrets, emitEvent, rate, fails, ratePerMin, resultWaitMs })`.
  `rate` (per trigger id) and `fails` (per IP, shared with the token gate) are
  [WindowCounter](WindowCounter.md)s.
- `handle(req, res)` expects `req.trigger` and the raw `req.body` Buffer.

## Flow

Each step either answers and stops, or passes on:

1. **Rate limit**: over `ratePerMin` deliveries a minute for this trigger ->
   429 `{ error: 'rate limited' }`, logged `rate_limited`.
2. **Signature**: when the trigger has a secret, `WebhookPresets.verify` runs
   on the raw bytes before anything reads the body. A failure counts toward the
   IP lockout, emits `rejected`, is logged `rejected` with only method and
   content type (no body from an unverified sender) and answers 401
   `{ error }`.
3. **Event**: [WebhookEvent](WebhookEvent.md)`.build`; with a secret,
   `event.verified` is the preset name.
4. **Handshake**: Slack's `{ type: 'url_verification', challenge }` is echoed
   as 200 `{ challenge }`, logged `handshake`, never captured or run.
5. **Sample**: a trigger without a sample stores this event as its sample, logs
   `captured`, emits `sample-captured` and `triggers-changed`, answers 202
   `{ captured: true }`, and does not run.
6. **Unarmed**: 503 `{ error: 'trigger not armed' }`, logged `unarmed`.
7. **Missing secret**: a preset that requires a secret (slack, github, generic
   with `authHeader`) and has none -> 503 `{ error: 'signing secret not
   configured' }`, logged `no_secret`.
8. **Fire**: `runner.fire(id, event, { kind: 'event', dedupeKey, source:
   'webhook', remote: ip })` with the preset's dedupe key; the reply comes from
   [WebhookFireReply](WebhookFireReply.md): refusals, then deferred and batched
   acks (with `deferred`/`resumesAt` or `batched`/`batchSize`), the plain ack,
   or, for `respond: 'result'`, the run's outcome.

## Why

Verification comes first and is never skipped once a secret exists, even for
the capturing first delivery and for handshakes. A preset that needs a secret
but has none can still capture a sample and answer handshakes so setup can
proceed, but an armed trigger never fires unverified.

Logging covers only the outcomes this receiver decides; the runner logs what it
accepts or refuses. A failing log write never fails the request.
