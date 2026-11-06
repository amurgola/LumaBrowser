# VaultCsv

`core/vault/VaultCsv.js`

Password CSV import and export. Columns are found by header name, so the exports of Chrome and Edge
(`name,url,username,password,note`), Firefox (`url,username,password,httpRealm,...`) and Bitwarden
(`login_uri,login_username,login_password,name,notes`) all read. Rows without a URL or password are skipped (a
Bitwarden secure note, for one). Export writes Chrome's format, which every one of them imports.

## Methods

- `VaultCsv.parse(text)` RFC 4180 rows (quoted commas, doubled quotes, newlines, a BOM).
- `VaultCsv.read(text)` -> `{ logins: [{ origin, username, password, title, notes }], skipped }`; throws for a file
  with no url or password column.
- `VaultCsv.write(logins)` CSV text, CRLF line ends.

## Two-factor

Import also reads a `login_totp` / `totp` / `otpauth` column (Bitwarden) into the login's `totp`. Export stays Chrome's format, which has no two-factor column.
