# ArtifactDataQuota

`core/llm-server/chat/artifacts/ArtifactDataQuota.js`

The size limits on a live artifact's saved data, for
[ArtifactDataStore](../ArtifactDataStore.md).

## Methods

- `ArtifactDataQuota.checkEntry(key, value)`: an error string or `null`. Keys
  must be non-empty strings of at most `MAX_KEY_LEN` (128); `undefined` is
  refused (store `null` or remove the key); the value must be
  JSON-serialisable (not a function, symbol or cycle) and at most
  `MAX_VALUE_BYTES` (64 KB) serialised.
- `ArtifactDataQuota.checkObject(data, serialized)`: an error string or `null`
  for the whole object after a write: at most `MAX_TOTAL_BYTES` (512 KB) and
  `MAX_KEYS` (256) keys.

Quota errors start with `store quota exceeded:`.

## Why

Errors are readable strings returned to the model or module (so it can shrink
the write), never exceptions.
