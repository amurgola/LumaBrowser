# InboundToken

`extensions/personal-hub/InboundToken.js`

The bearer token an automation presents to the Hub's inbound routes.
Generated on first use (`hub_` plus 48 hex characters), kept under the
extension's settings key `inboundToken`, rotated from the settings tab.

## Methods

- `new InboundToken(db, { random? })`.
- `get()`: the token, creating one when none is stored.
- `rotate()`: a fresh token (the old one stops working at once).
- `matches(headers)`: true for `Authorization: Bearer <token>` or
  `X-Hub-Token: <token>`, compared in constant time.
