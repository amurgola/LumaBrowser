# ApiSecurity

`core/shell/ApiSecurity.js`

The policy guarding the app's `/api` gateway: which network origins may call it
and whether an API key is required. It also owns the stored `luma_*` API keys,
which the sd-server [AuthProxy](../image-server/server/AuthProxy.md) and network
sharing accept as well.

## Methods

- `new ApiSecurity(db)`; `db` is the settings database (`get(key, def)`,
  `set(key, value)`), or `null` for an in-memory policy that never persists.
- `reload()` re-reads the stored policy (settings key `core.apiSecurity`).
- `middleware()` returns Express middleware that answers 403 `Origin not allowed
  by API security policy` when the peer fails the network mode, then 401
  `Invalid or missing API key` when keys are required and the request has no
  valid key. `/health` is exempt from the key check (liveness probes, including
  the stdio MCP bridge's auto-start check) but not from the origin check. The
  middleware reads the live policy, so a `reload()` or setter applies to an
  already-mounted middleware.
- `isValidKey(key)` is true for a configured key (trimmed). It ignores
  `requireApiKey`; the caller decides whether a key is needed.
- `getConfig()` returns a copy of `{ networkMode, ipWhitelist, requireApiKey, apiKeys }`.
- `setNetworkMode(mode)`, `setWhitelist(list)`, `setRequireApiKey(enabled)`
  return `{ success }` or `{ success: false, error }`. `setWhitelist` trims and
  de-duplicates, and rejects the whole list on the first invalid entry.
- `createKey(label)`, `updateKeyLabel(id, label)`, `refreshKey(id)` return
  `{ success, key: entry }`; `deleteKey(id)` returns `{ success }`. Unknown ids
  return `{ success: false, error: 'Key not found' }`.
- `ApiSecurity.STORAGE_KEY`, `ApiSecurity.VALID_MODES`.

Network modes: `any` (everyone), `system` (loopback only), `lan` (loopback,
private, link-local, CGNAT via [IpClass](../shared/net/IpClass.md)),
`whitelist` (the [IpWhitelist](api-security/IpWhitelist.md)). Keys come from
`Authorization: Bearer <key>` or `X-Api-Key`.

Helpers: [ApiSecurityConfig](api-security/ApiSecurityConfig.md) (stored shape
and defaults), [IpWhitelist](api-security/IpWhitelist.md),
[ApiKeyEntry](api-security/ApiKeyEntry.md) (key entries and header reading).
