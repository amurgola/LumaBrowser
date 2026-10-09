# WebhookFireReply

`core/llm-server/chat/triggers/webhook/WebhookFireReply.js`

Turns the trigger runner's answer to a webhook fire into the HTTP reply. Used
by [WebhookDelivery](WebhookDelivery.md).

## Methods (all static)

- `refused(res, fire)` for `fire.accepted === false`: policy non-runs are 200
  (`duplicate delivery` -> `{ accepted: true, duplicate: true }`; `filtered` ->
  `{ accepted: false, filtered: true, failed }`; `cooldown` ->
  `{ accepted: false, cooldown: true, retryAfterSeconds }`; `quiet_hours` ->
  `{ accepted: false, quiet: true, resumesAt }`), anything else 503
  `{ error: reason || 'not accepted' }`.
- `ack(res, preset, extra?)` sends `WebhookPresets.ackResponse(preset)`: a JSON
  ack (202 `{ accepted: true }`) merged with `extra`, or Slack's empty text 200
  (extra is dropped).
- `async result(res, fire, trigger, waitMs)` waits up to `waitMs` for
  `fire.done`: on timeout 202 `{ accepted: true, pending: true, pollPath:
  '/hooks/<token>/runs' }`; a `null` run 503 `{ error: 'run was dropped' }`;
  otherwise status 200 (`ok`), 422 (`shapeError`) or 500, with the run's
  `responseBody` as JSON or text when set and the shape check passed, else
  `{ runId, status, response, error }`.
- `POLICY_REPLIES` is the reason-to-body table.

## Why

Intentional non-runs are 2xx because the event was received and handled by
policy; a sender that sees 5xx retries, which would only repeat the refusal.
Deferred and batched events run later, so even `result` mode acknowledges them
at once. A run that returns the wrong shape is the caller's 422.
