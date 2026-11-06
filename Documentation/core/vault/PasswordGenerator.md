# PasswordGenerator

`core/vault/PasswordGenerator.js`

Strong passwords from `crypto.randomInt`: 20 characters with at least one lowercase, uppercase, digit and symbol
(`-_.!@#$%*`), no look-alikes (0, O, 1, l, I), shuffled.

## Methods

- `PasswordGenerator.generate(length = 20, randomInt?)`.
