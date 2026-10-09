# LumaRequestSigner

`core/shared/lumabyte/LumaRequestSigner.js`

Holds the lumabyte.com client secret and builds the identifying headers every
request to that host carries.

## Methods

- `LumaRequestSigner.computeToken(machineId)` returns a hex HMAC-SHA256 of
  `v1.<machineId>.<window>`, where the window is the current 30-second bucket,
  or `null` without a machine id.
- `LumaRequestSigner.buildAuthHeaders(identity)` returns `X-Machine-Id` and
  `X-Luma-Token` when `identity.machineId` is set (see
  [MachineIdentity](../../install/MachineIdentity.md)). A null identity yields `{}`.
  There is no `Authorization` header: license keys were removed with the Keygen
  paid tiers on 2026-10-04.
- `LumaRequestSigner.CLIENT_SECRET` and `LumaRequestSigner.TOKEN_WINDOW_SECONDS` (30).

## Why one home for the secret

The pulse, shared templates and the add-on catalog each held a copy of the
secret and the token function. Rotating it was an unenforced three-file edit,
and all three clients fail soft, so a missed copy gave a silently dead
subsystem. A test scans `core/` and fails if the secret appears anywhere else.

The secret is obfuscation, not defence: a shipped desktop client cannot hold a
real one. Rotate it on the signed-release cadence and keep it in sync with
`currentClientSecret()` on the LumaByte server. Tokens roll every 30 seconds so
a captured one expires quickly.
