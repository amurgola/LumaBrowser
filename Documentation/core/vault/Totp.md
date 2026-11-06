# Totp

`core/vault/Totp.js`

Two-factor codes (RFC 6238 TOTP, the six-digit codes authenticator apps show). A login's `totp` holds the base32
setup key a site shows or the `otpauth://totp/...` URI from its QR code (digits 6 to 8, period 10 to 300 s, SHA1,
SHA256 or SHA512). Tested against the RFC 6238 appendix B vectors.

## Methods

- `Totp.parse(text)` -> `{ secret, digits, period, algorithm }` or null.
- `Totp.base32(text)` RFC 4648 decode (spaces, dashes and padding ignored), null for an invalid character.
- `Totp.code(text, now = Date.now())` -> `{ code, secondsLeft }` or null.
