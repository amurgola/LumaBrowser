# ApiSecurityConfig

`core/shell/api-security/ApiSecurityConfig.js`

The stored shape of the [ApiSecurity](../ApiSecurity.md) policy.

## Methods

- `ApiSecurityConfig.STORAGE_KEY` is `'core.apiSecurity'`.
- `ApiSecurityConfig.VALID_MODES` is the Set `any`, `system`, `lan`, `whitelist`.
- `ApiSecurityConfig.isValidMode(mode)`.
- `ApiSecurityConfig.freshNetworkMode(env = process.env)` is `'any'` when
  `LUMA_DOCKER` is set, else `'system'`.
- `ApiSecurityConfig.defaults(env)` returns a fresh default config.
- `ApiSecurityConfig.normalize(raw, env)` merges `raw` over the defaults and
  coerces the fields: non-array lists become `[]`, `requireApiKey` a boolean.

## Why the two mode defaults

Fresh profiles (nothing stored) get localhost-only. A stored config is never
tightened: one with an unknown mode falls back to `any`, which was the default
before fresh profiles became localhost-only. Docker and headless images are
driven from outside the container, so they keep `any`.
