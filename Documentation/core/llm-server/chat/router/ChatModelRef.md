# ChatModelRef

`core/llm-server/chat/router/ChatModelRef.js`

Reads the chat's model routing key: `local::<modelBasename>` is the managed local server, `<providerConfigId>::<modelId>` a remote provider config (a paired sharing peer included).

## Methods

All static.

- `isLocal(ref)`: a string starting with `local::`.
- `localName(ref)`: the stem after `local::` (`''` for the bare `local::`).
- `split(ref)`: `{ providerId, modelId }` split at the FIRST `::`, or null (no separator, not a string). A peer ref like `peer:p1:llm::local::big` keeps `local::big` as its model id.
- `providerTag(ref)`: `'local'`, the config id, or null; the provider column on conversations and messages.
- `LOCAL_PREFIX`, `SEPARATOR`.

## Why

Every router class parses refs; one reader keeps the rules (first separator, empty provider id) in one place.
