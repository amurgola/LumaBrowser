# WebhookBodyParser

`core/llm-server/chat/triggers/webhook/WebhookBodyParser.js`

Parses a webhook's raw request bytes by content type. Never throws.

## Methods (all static)

- `parse(raw, contentType = '')` returns:
  - `{ body: null, bodyText: null }` for an empty or non-Buffer body;
  - JSON (content type contains `json`, or no type and the text starts with
    `{` or `[`): `{ body: <parsed>, bodyText: null }`, or
    `{ body: null, bodyText: <text> }` when it does not parse;
  - `application/x-www-form-urlencoded`: `{ body: { key: value }, bodyText: null }`,
    with a `payload` field parsed as JSON when it is JSON (Slack interactive
    posts);
  - `text/*`, anything with `xml`, or no type: `{ body: null, bodyText }`;
  - anything else: `{ body: null, bodyText: null, bodyBase64, bodyBytes }`, the
    base64 capped at `BINARY_PREVIEW_CHARS` (8192).

## Why

The hosts skip their body parsers for `/hooks` so signatures can be checked on
the exact bytes; this is the parsing that happens afterwards. Non-JSON senders
(form posts, plain text) are common, so nothing is rejected for its format.
