# PulseService

`core/pulse/PulseService.js`

The anonymous check-in to lumabyte.com every five minutes, so the server can
count installs (ever registered, and online in the last ten minutes) and see
the version and platform spread. It is the only LumaByte check-in left and it
only runs while [TelemetryConsent](../telemetry/TelemetryConsent.md) allows it.

## Methods

- `new PulseService({ identity, consent, baseUrl, intervalMs, client })`:
  `identity` is the [MachineIdentity](../install/MachineIdentity.md), `consent`
  the TelemetryConsent. `baseUrl`
  defaults to `https://lumabyte.com`, `intervalMs` to 5 minutes. `client`
  defaults to a [SignedLumaClient](../shared/lumabyte/SignedLumaClient.md)
  labelled `PulseService` whose `allowEgress` is `consent.allowed`.
- `start()` does nothing (and logs why) when consent is off; otherwise starts
  the loop once: first check-in after 15 s, then every interval. Repeated calls
  are no-ops.
- `stop()` cancels both the pending first check-in and the interval.
- `pulseNow()` runs one check-in immediately; resolves `true` on a 2xx.
- `getStatus()` returns `{ tier: 'community', enabled, running }`.

A check-in: re-check consent (an opt-out stops the loop's effect at once),
skip if there is no machine id, then POST
`{ tier: 'community', version, platform }` to `/api/pulse` with a 4 s timeout
and the pulse-only User-Agent from [PulseDeviceInfo](PulseDeviceInfo.md). The
signing headers (`X-Machine-Id`, `X-Luma-Token`) come from the client. Nothing is
recorded locally either way.

## Why

Consent is checked twice on purpose: once per tick, and again by the client's
egress policy on every request, so no future code path can send a check-in
from an install that opted out. Developer mode counts as opted out.

The User-Agent override is the one place the app reports the real OS and
architecture instead of the Chrome spoof, so the server's client view can tell
platforms apart.

## No good-standing gate

Legacy also kept a "good standing" rule: two timestamps
(`core.pulse.lastSuccessAt`, `core.pulse.lastAttemptAt`) and a 24 h grace
period, after which the (since removed) page-template generator refused to
run with `PULSE_GATE` and an "upgrade to Pro" message. The owner dropped it on
2026-10-04: the product promises it works fully offline and has no paid tiers,
so a missed check-in must never switch a feature off. `isInGoodStanding()`,
the timestamps and the `PULSE_GATE` refusal are gone; the old settings keys
are simply no longer read.
