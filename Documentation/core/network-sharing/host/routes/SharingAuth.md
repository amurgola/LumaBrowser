# SharingAuth

`core/network-sharing/host/routes/SharingAuth.js`

Express middleware guarding `/sharing`.

## Methods

- `new SharingAuth(service)` (`getBindMode`, `isEnabled`, `verifyCredential`).
- `originPolicy`: 403 `{ error: 'Origin not allowed by sharing policy' }`
  unless `OriginPolicy.originAllowed(service.getBindMode(), req)`.
- `requireEnabled`: 503 `{ error: 'Network Sharing is disabled on the host' }`.
- `requireToken`: 503 when disabled, then the Authorization bearer through
  `verifyCredential`; 401 `{ error: 'Invalid or missing credential' }` on a
  miss; sets `req.sharingToken`.
- `requireBrowserCredential({ as = 'json' })`: the same, but the credential may
  also come from the `luma_share_token` cookie or `?token=`
  ([SharingCredentialReader](../SharingCredentialReader.md)); `as: 'text'`
  sends the same messages as plain text for document routes.

## Why

A disabled host answers 503 before any credential check, so it never reveals
whether a presented credential was valid. The wider browser credential is
confined by name to the routes an iframe, a script tag or a cookie-riding
fetch reaches; `as` only picks the error encoding, since a JSON body would
render as literal text inside a frame.
