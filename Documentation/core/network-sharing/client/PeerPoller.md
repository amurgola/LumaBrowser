# PeerPoller

`core/network-sharing/client/PeerPoller.js`

Re-fetches every enabled peer's manifest on a timer, so a host-side model
change reaches this machine's pickers without a re-pair or restart.

## Methods

- `new PeerPoller({ peerStore, fetchManifest(peer), upgradeTls(peerId), register(peer), notify() })`.
- `start(intervalMs = 15000)` idempotent: clears persisted backoff, starts an
  unref'd interval and polls once immediately.
- `stop()` clears the interval.
- `pollOnce()` one pass (re-entrancy guarded). For each enabled peer outside
  its backoff window:
  1. once per run, a plain-HTTP peer is offered the TLS upgrade;
  2. the manifest is fetched;
  3. failure: records a friendly `error`, `online: false`, `_failCount` and
     `_nextAttemptAt = now + backoffMs(failCount)`; the existing registration stays;
  4. success: stores the manifest, `online: true`, `lastSeenAt`, resets the
     counters, and re-registers when the signature changed or the peer was offline.
  `notify()` runs once after the pass when anything was re-registered or upgraded;
  a throw from it is swallowed.
- `PeerPoller.friendlyError(raw)` keeps auth guidance (`token`, `re-pair`, `401`)
  verbatim, turns connection failures into `Offline: host unreachable.`, and
  defaults to `Could not reach host.`.
- `PeerPoller.backoffMs(failCount)` is `min(5 min, 15 s * 2^min(failCount - 1, 5))`.

## Why

A transient blip must not yank a peer's models out of the picker mid-use, so
failures never unregister. An offline host would otherwise log a connect
timeout every 15 seconds forever, hence the backoff. Backoff always widens from
15 s even if the loop runs at a different interval (legacy behaviour).
