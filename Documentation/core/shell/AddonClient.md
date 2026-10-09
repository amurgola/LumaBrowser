# AddonClient

`core/shell/AddonClient.js`

Client for the optional add-on catalog on lumabyte.com. Lists the downloadable
extensions and fetches one add-on .zip.

## Methods

- `new AddonClient({ identity, baseUrl = 'https://lumabyte.com' })`; `identity`
  is the [MachineIdentity](../install/MachineIdentity.md) used to sign requests
  through [SignedLumaClient](../shared/lumabyte/SignedLumaClient.md).
- `listAddons()` calls `GET /api/addons` (6 s timeout) and resolves
  `{ ok: true, extensions }`, or `{ ok: false, error, extensions: [] }` for no
  response, 401, any other non-2xx, or a malformed body.
- `downloadAddon(id)` calls `GET /api/addons/<id>/download` (60 s timeout) and
  resolves `{ ok: true, data: Buffer, sha256 }`. When the server sends
  `X-Addon-SHA256`, the bytes must hash to it (case-insensitive) or the result is
  `{ ok: false, error: 'Integrity check failed (sha256 mismatch)' }`. `sha256` is
  `null` when no hash was sent. Missing id, network failure, 404, other non-2xx
  and an empty body each resolve `{ ok: false, error }`.

Neither method throws.

## Egress policy

Ungated (`allowEgress: () => true`), unlike the pulse (telemetry consent). Browsing the catalog is a feature the
user is actively invoking by opening the Extensions tab, so identifying the
install there is authentication, not background reporting. If that stance ever
changes, the `allowEgress` line in the constructor is the only edit.
