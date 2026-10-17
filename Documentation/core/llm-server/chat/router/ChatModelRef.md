# ChatModelRef

`core/llm-server/chat/router/ChatModelRef.js`

Reads the chat's model routing key: `local::<modelBasename>` is the managed local server, `<providerConfigId>::<modelId>` a remote provider config (a paired sharing peer included), and `profile::<id>` a model profile, which [ModelSettings](../../service/ModelSettings.md) resolves to its base ref before anything routes on it.

## Methods

All static.

- `isLocal(ref)`: a string starting with `local::`.
- `localName(ref)`: the stem after `local::` (`''` for the bare `local::`).
- `split(ref)`: `{ providerId, modelId }` split at the FIRST `::`, or null (no separator, not a string). A peer ref like `peer:p1:llm::local::big` keeps `local::big` as its model id.
- `providerTag(ref)`: `'local'`, the config id, or null (also for a profile ref, which has no provider of its own); the provider column on conversations and messages.
- `isProfile(ref)`: a string starting with `profile::`.
- `profileRef(id)`: `profile::<id>`.
- `profileId(ref)`: the id after `profile::`, `''` for anything else.
- `LOCAL_PREFIX`, `SEPARATOR`, `PROFILE_PREFIX`.

## Why

Every router class parses refs; one reader keeps the rules (first separator, empty provider id) in one place.
