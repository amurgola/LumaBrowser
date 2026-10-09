# ExtensionRouteTable

`core/shell/rest-gateway/ExtensionRouteTable.js`

Tracks which extension owns which REST prefix and whether it is disabled.

## Methods

- `ExtensionRouteTable.defaultPrefix(id)`: `/api/ext/<id>`.
- `record(id, router, prefix)`: remember an extension's manual-route mount.
- `prefixOf(id)`: the recorded prefix, else the default.
- `extensionIds()`, `prefixes()` (`[{ id, prefix }]`, registration order).
- `disable(id)`, `enable(id)`, `isDisabled(id)`.
- `gate(id, router)`: middleware that answers
  `503 { error: 'Extension disabled', extensionId }` while disabled, else
  passes to `router`.

## Why

Manual routes and `context.expose()` routes both mount through `gate`, so
disabling an extension closes both doors by construction. `UpgradeRouter` reads
`isDisabled` for WebSocket upgrades too.
