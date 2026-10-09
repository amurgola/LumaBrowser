# KeepAliveSweep

`core/browser/tab-view/KeepAliveSweep.js`

Keeps persisted tabs fully loaded and notification-capable on a timer.

## Methods

- `new KeepAliveSweep({ registry, revive })`; `revive(entry)` is `PersistedTabs.revive`.
- `start(runSweep, { initialDelayMs = 60 s, intervalMs = 1 h })`: one pass after the
  initial delay (letting the boot restore's loads settle), then one per interval.
  Restarting replaces running timers; a rejected `runSweep()` is logged, not thrown.
- `stop()`.
- `activateAll()` -> `{ checked, healthy, reloaded, revived }`. Per persisted tab:
  destroyed webContents -> revived; crashed renderer -> reloaded; loading -> left
  alone (healthy); otherwise the activation heartbeat runs, and no answer within
  10 s (or a rejection) means wedged -> reloaded (revived if reload throws).
  Crash-trace marks `keepalive:sweep-start`, `keepalive:tab`, `keepalive:sweep-end`.

## Why

`backgroundThrottling: false` pins `visibilityState` to visible, but apps such as
Slack and Discord key presence off focus and visibility events. The heartbeat
dispatches synthetic `focus` and `visibilitychange` events with
`userGesture = true` (keeping gesture-gated audio for notification sounds
unlocked), without ever taking real focus from the user. Resolving at all proves
the renderer's event loop is alive.

TabViewManager passes `() => this.activatePersistedTabs()` as `runSweep`, so the
timer always goes through the facade.
