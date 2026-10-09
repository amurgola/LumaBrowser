# MachineIdentity

`core/install/MachineIdentity.js`

Resolves this install's stable machine id once at startup. Requests to
lumabyte.com (pulse, shared templates, add-on catalog) are signed with it by
[LumaRequestSigner](../shared/lumabyte/LumaRequestSigner.md).

## Methods

- `new MachineIdentity({ env, readMachineId })`: both optional; defaults are
  `process.env` and `node-machine-id`'s `machineId({ original: true })`.
- `resolve()` reads the id once and caches it. `LUMA_MACHINE_ID` in the
  environment overrides the host id (test fleets, containers); a blank value
  is ignored.
- `machineId` is the cached id, or `null` before `resolve()`.

## Why it exists

Legacy kept the machine id inside LicenseService, which also validated Keygen
license keys for the pro and enterprise tiers. Those tiers were never sold and
the product is free, so the Keygen integration was removed on 2026-10-04. The
two things still needed from it became their own classes: this one, and
[TelemetryConsent](../telemetry/TelemetryConsent.md).
