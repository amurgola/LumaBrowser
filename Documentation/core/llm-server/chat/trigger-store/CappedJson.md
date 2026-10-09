# CappedJson

`core/llm-server/chat/trigger-store/CappedJson.js`

JSON-encodes a value under a hard character cap.

## Methods

- `CappedJson.stringify(value, maxChars)`: the JSON when it fits; otherwise
  `{"_truncated":true,"_originalChars":<n>,"text":<first maxChars - 200 chars of the JSON>}`.
  An unserialisable value (a cycle) is stored as its `String()`; `undefined` gives `null`.

## Why

Run rows keep the inbound event forever (transcripts get pruned), so a runaway
payload must not bloat settings.db.
