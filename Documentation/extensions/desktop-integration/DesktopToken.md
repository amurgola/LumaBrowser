# DesktopToken

`extensions/desktop-integration/DesktopToken.js`

The token desktop clients present to `/api/desktop`. Generated on first use
(`dsk_` plus 48 hex characters), kept under the extension's settings key
`token` (`ext.desktop-integration.token`), published in the handshake file,
rotated from the settings tab.

## Methods

- `new DesktopToken(db, { random? })`.
- `get()`: the token, creating one when none (or a value without the prefix) is stored.
- `rotate()`: a fresh token; the old one stops working at once.
- `matches(headers)`: true for `X-Luma-Desktop-Token: <token>` or
  `Authorization: Bearer <token>` (the dedicated header wins), compared in
  constant time.
- `DesktopToken.presented(headers)`: the token a request carries, or null.
