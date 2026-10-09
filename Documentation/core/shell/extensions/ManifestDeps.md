# ManifestDeps

`core/shell/extensions/ManifestDeps.js`

Reads what a manifest declares it depends on. Every grant an extension gets
(core services, tables, slots, extension APIs) goes through these readers.

## Methods

All static.

- `required(manifest)`, `optional(manifest)`, `all(manifest)` (optional config
  wins on a shared key), `declares(manifest, depKey)`, `declaration(manifest, depKey)` (or `{}`).
- `isCore(depKey)`, `isExt(depKey)`, `extId('ext:x')` -> `'x'`.
- `coreServiceKey(depKey)` maps `core:llm-service` to `llm`, every other
  `core:<name>` to `<name>`. `coreService(coreServices, depKey)` the service or null.
- `declaredCoreService(manifest, coreServices, depKey)` the service only when declared.
- `requiredExtIds`, `optionalExtIds`, `extIds`, `requiresExt(manifest, extId)`.
- `llmSlots(manifest)` the slots of a REQUIRED `core:llm-service` declaration, else `[]`.
- `declaredTables(manifest)` table names declared on `core:database` (strings or `{ name }`).

## Why

`core:license` used to map to `coreServices.license`. With Keygen licensing
gone, nothing provides it: a manifest requiring it is unresolvable and one
declaring it optionally gets nothing.
