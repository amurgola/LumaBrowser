# WebhookPresets

`core/llm-server/chat/triggers/WebhookPresets.js`

What a well-known webhook sender needs: verification, dedupe id, loop guard and
acknowledgement shape.

## Methods

- `WebhookPresets.PRESETS` is `['generic', 'slack', 'github']`;
  `normalizePreset(p)` maps anything else to `generic`.
- `requiresSecret(preset, source)`: always for slack and github; for generic only
  when `source.authHeader` is set.
- `verify(preset, { rawBody, headers, secret, source, now })` returns
  `{ ok: true }` or `{ ok: false, error }`. Headers are looked up lowercased (the
  first value of an array).
  - slack: signing secret v0, `v0=` + HMAC-SHA256 of `v0:<ts>:<raw>` in
    `X-Slack-Signature`, with `X-Slack-Request-Timestamp` within
    `SLACK_MAX_SKEW_S` (300 s) of `now`.
  - github: `X-Hub-Signature-256` = `sha256=` + HMAC-SHA256 of the raw body.
  - generic: passes unless `source.authHeader` is set, then that header must
    equal the secret.
  Comparisons are constant-time.
- `dedupeKeyFor(preset, { body, headers, source })`: `slack:<body.event_id>`,
  `github:<X-GitHub-Delivery>`, or `hdr:<value>` of `source.dedupeHeader`; else `null`.
- `loopGuard(preset, body)` returns `{ skip: false }` or `{ skip: true, reason }`:
  slack skips `event.bot_id`, subtype `bot_message`, and messages from the app's
  own user (`authorizations[].user_id`); github skips senders of type `Bot` or a
  login ending in `[bot]`; generic never skips.
- `ackResponse(preset)`: slack `{ status: 200, text: '' }`, others
  `{ status: 202, json: { accepted: true } }`.
- `signSlack(secret, rawBody, ts?)` and `signGithub(secret, rawBody)` return the
  headers a sender would send (used by tests and the e2e suite).

## Why

The Slack ack is an empty 200 because a JSON body on a slash-command ack would be
posted into the channel as a message.

The loop guard exists because a Slack trigger that replies in a channel receives
its own reply as a new message event; without it, it answers itself forever.
