# SignedLumaClient

`core/shared/lumabyte/SignedLumaClient.js`

The single signed HTTP client for lumabyte.com, used by the pulse check-in,
shared templates and the add-on catalog.

## Methods

- `new SignedLumaClient({ baseUrl, identity, allowEgress, label = 'LumaByte', defaultHeaders = {} })`
  throws if `allowEgress` is not a function. `identity` is the
  [MachineIdentity](../../install/MachineIdentity.md) (legacy passed `licenseService`). `label` prefixes warning logs.
  `baseUrl` is stored but not used to build URLs; callers pass absolute URLs.
- `client.request({ method, url, body, timeoutMs = 6000, headers })` resolves
  `{ statusCode, headers, body: Buffer }`, or `null` on any failure: denied
  egress, a throw from `net.request`, a request or response error, or the
  timeout (which also aborts the request). It never rejects.
- `SignedLumaClient.headerValue(header)` flattens an Electron header value that
  may be a `string[]` to its first entry, and `null`/`undefined` to `''`.

Headers merge in this order, later winning: `defaultHeaders`, the auth headers
from [LumaRequestSigner](LumaRequestSigner.md), then per-request `headers`. The
pulse uses that to report the real device User-Agent instead of the app-wide
Chrome spoof.

## Why allowEgress is required

The bug this closes was a client that never stated a policy at all, and so
sent a machine id from an install whose settings promised the opposite. With no default, a new call site has to state its policy in code
where a reviewer can see it. The policy is checked before every request rather
than cached, so a consent change applies without a restart. A denied request
resolves `null`, which callers already treat as "could not reach the server",
so a gated client degrades like an offline one.

## Why the timer outlives the headers

The legacy pulse copy cleared its abort timer when response headers arrived
and had no response error handler. A body that stalled mid-stream then left the
promise pending forever, leaking one per five-minute tick. Here the timer is
cleared only when the body ends or errors.
