# SharingCredentialReader

`core/network-sharing/host/SharingCredentialReader.js`

Reads the credential a request to `/sharing` presents.

## Methods

- `SharingCredentialReader.bearer(req)`: the `Authorization: Bearer <token>`
  value (case-insensitive scheme, trimmed), else null.
- `SharingCredentialReader.browser(req)`: the bearer, else `?token=`, else the
  `luma_share_token` cookie (URL-decoded; the raw value if decoding fails), else null.

## Why

Normal routes take the header only. The few browser-navigated routes (an
iframe src, a script src, fetches riding a document's cookies) cannot set a
header, so they accept the wider set; the query form lands in proxy logs,
referers and history, which is why it is confined to those routes (see
[SharingAuth](routes/SharingAuth.md)).
