# ClientRegistry

`extensions/desktop-integration/ClientRegistry.js`

The desktop clients seen since launch, keyed by the name in their
`X-Luma-Client: <name>/<version>` header (no header: `unknown`). In memory
only, at most 100 clients (the oldest is dropped). Listed in the settings tab.

## Methods

- `new ClientRegistry({ now?, onChange? })`: `onChange(entry)` runs after every record.
- `ClientRegistry.parse(header)` -> `{ name, version }`.
- `record(headers, feature?)`: bumps `requests`, sets `lastSeen` and the
  version, counts the feature. Called for every authenticated request that
  reaches a feature.
- `list()`: copies of `{ name, version, firstSeen, lastSeen, requests, features: { <id>: count } }`, newest first.
- `clear()`.
