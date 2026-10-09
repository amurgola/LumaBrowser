# WebhookEvent

`core/llm-server/chat/triggers/webhook/WebhookEvent.js`

Builds the event record a webhook delivery hands to a trigger run and stores as
the sample.

## Methods (all static)

- `build(req)` returns `{ receivedAt, method, contentType, query, headers, body }`
  plus `bodyText` (text, or JSON that failed to parse) or `bodyBase64` and
  `bodyBytes` (binary), parsed by [WebhookBodyParser](WebhookBodyParser.md) from
  the raw `req.body`. `contentType` is `null` when absent. The whole record goes
  through `TriggerPayload.sanitize` (control characters stripped).
- `safeHeaders(headers)` drops `authorization`, `cookie`, `set-cookie`,
  `proxy-authorization`, `host` and any header whose name contains `secret`,
  `token`, `signature`, `api-key`, `apikey` or `password`; array values are
  joined with `, `.
- `HEADER_DENY_RE` is that rule.

## Why

Webhook payloads are untrusted and end up in a model's context and in the
delivery log. Credentials and signatures are never useful to the run and must
never be shown to it or stored with the sample.
