# CivitaiAuth

`core/shared/download/CivitaiAuth.js`

The one source of the CivitAI API key for catalog calls and downloads, and the rule for which hosts may see it.

## Methods

- `CivitaiAuth.token()` the runtime key set through `setToken`, else the trimmed `CIVITAI_TOKEN`, else `CIVITAI_API_KEY`, else `null`. `hasToken()` is the boolean form.
- `CivitaiAuth.setToken(token)` installs a key read from settings (a later step stores it under the image server's settings); `null` or `''` clears it so the environment applies again.
- `CivitaiAuth.isCivitaiUrl(url)` true for `civitai.com` and its subdomains; false for anything else or an unparsable string.
- `CivitaiAuth.headersFor(url)` `{ Authorization: 'Bearer <key>' }` for a CivitAI URL when a key is set; `{}` otherwise.
- `CivitaiAuth.ENV_VARS`, `CivitaiAuth.HOST`.

## Why

Mirrors [HubAuth](HubAuth.md). CivitAI's download endpoint answers a 307 to a signed Cloudflare R2 URL that carries its own credentials; the key belongs on the `civitai.com` request only, and axios drops the Authorization header on a cross-host redirect, so a transfer that starts with these headers never forwards the key to storage. Listing and most downloads need no key at all; it unlocks early-access and login-gated versions.
