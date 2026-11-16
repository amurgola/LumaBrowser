# OpenAccessMigration

`core/shell/api-security/OpenAccessMigration.js`

A one-time step for profiles made when the API answered any address by default.

## Methods

- `OpenAccessMigration.run(db, env = process.env)` returns `true` when it
  narrowed the stored policy. It runs once per profile (settings key
  `core.apiSecurity.openAccessReviewed`): a stored `core.apiSecurity` whose
  network mode is `any` (or unknown, which
  [ApiSecurityConfig](ApiSecurityConfig.md) reads as `any`) with no key required
  becomes `lan`. Keys, the whitelist and every other field are kept.

Left alone: a fresh profile (nothing stored), `any` with a key required, the
other modes, a Docker image (`LUMA_DOCKER`), and a missing database.

## Why

`any` was the default before fresh profiles became localhost-only, so an
upgraded install could still answer the whole internet with no key if its port
was forwarded. `lan` keeps every device on the user's network and Tailscale
working and cuts only keyless callers from public addresses. Through a proxy or
tunnel the caller looks local, which is why [ApiSecurity](../ApiSecurity.md)
asks proxied requests for a key in every mode but `any`.

The marker is written on the first run whatever the outcome, so a user who
later picks `any` in Settings on purpose keeps it.
[FoundationServices](../../../app/services/FoundationServices.md) runs it before
building ApiSecurity and [HeavyServices](../../../app/ready/HeavyServices.md)
shows the one notice.
