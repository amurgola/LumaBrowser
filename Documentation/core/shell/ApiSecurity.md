# ApiSecurity

`core/shell/ApiSecurity.js`

The policy guarding the app's `/api` gateway: which network origins may call
it, that a keyless caller is a local program or one of the app's own pages, and
whether an API key is required. It also owns the stored `luma_*` API keys,
which the sd-server [AuthProxy](../image-server/server/AuthProxy.md) and network
sharing accept as well.

## Methods

- `new ApiSecurity(db)`; `db` is the settings database (`get(key, def)`,
  `set(key, value)`), or `null` for an in-memory policy that never persists.
- `reload()` re-reads the stored policy (settings key `core.apiSecurity`).
- `middleware({ allowNavigation = false })` returns Express middleware. It reads
  the live policy, so a `reload()` or setter applies to an already-mounted
  middleware. In order:
  1. 403 `Origin not allowed by API security policy` when the peer address fails
     the network mode.
  2. A request with a valid API key passes here: a key holder is trusted from
     any page and through any proxy.
  3. 403 with the [WebOriginGuard](api-security/WebOriginGuard.md) reason when
     another site's page sent the request or it came under a name DNS rebinding
     would use. `allowNavigation` (the page routes) lets a link or a typed
     address open a page.
  4. 401 `This request came through a proxy...` when the request carries a
     forwarding header (`Forwarded`, `X-Forwarded-For`, `X-Forwarded-Host`,
     `X-Real-IP`, `Via`, `CF-Connecting-IP`) and the mode is not `any`: the peer
     address is the proxy's, so the network rule says nothing about the caller.
  5. 401 `Invalid or missing API key` when keys are required and the request
     shows neither a key nor the internal token. `/health` is exempt from this
     step only (liveness probes, including the stdio MCP bridge's auto-start
     check).
- `internalToken()` is what the app's own pages send in place of an API key
  ([InternalBearerInjector](../../app/ready/InternalBearerInjector.md) adds it).
  It is new on every launch and never stored. It satisfies step 5 only: it does
  not make a foreign page (step 3) or a proxied request (step 4) ours.
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
[ApiKeyEntry](api-security/ApiKeyEntry.md) (key entries and header reading),
[WebOriginGuard](api-security/WebOriginGuard.md) (foreign pages and rebinding),
[OpenAccessMigration](api-security/OpenAccessMigration.md) (the one-time
narrowing of an old profile's `any` with no key).

## Who needs a key

| Caller | No key required | Key required |
|---|---|---|
| A local program (curl, the MCP bridge, the CLI) | passes | needs a key |
| The app's own pages on the gateway | pass | pass with the internal token |
| A page on any other origin, another local port included | needs a key | needs a key |
| Anything through a reverse proxy or tunnel (mode not `any`) | needs a key | needs a key |

Network Sharing (`/sharing`) and webhooks (`/hooks`) are not behind this policy;
they keep their own credentials.
