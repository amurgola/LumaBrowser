# TriggerSource

`core/llm-server/chat/triggers/TriggerSource.js`

Base class for in-app trigger sources that subscribe to an upstream appearing
after core wiring and route its events to matching triggers.

## Methods

- `new TriggerSource({ triggerStore, runner, getUpstream })` throws
  `<Class> needs triggerStore + runner` without both. `triggerStore` needs
  `list()`; `runner` needs `deliver(triggerId, event, { dedupeKey, source })`.
- `upstream()` returns `getUpstream()` or `null` (a throwing getter is `null`).
- `ensureSubscribed()` subscribes once the upstream exists and returns whether it
  is subscribed. Safe to call repeatedly; re-subscribes (releasing the old one)
  only when the upstream instance changed.
- `stop()` unsubscribes.
- `triggerStore` and `runner` are public fields.

Subclasses set `static KIND` (the trigger kind and the `source` passed to
`deliver`) and implement:

- `_canSubscribe(upstream)`: whether this upstream can be subscribed to;
- `_subscribe(upstream, listener)`: subscribe and return the unsubscribe function;
- `_handle(payload)`: process one upstream event;
- `_matchesTrigger(trigger, event)`: scope check for a trigger of this kind.

`_deliverToMatching(event, dedupeKey)` (protected) delivers to every trigger of
`KIND` that matches and returns the deliveries.

## Implementations

- [NotificationSource](NotificationSource.md)
- [PageChangeSource](PageChangeSource.md)

## Why

The upstreams (the TabViewManager, the page-change-detector extension) are
created after core wiring, so subscription is lazy and `main.js` calls
`ensureSubscribed()` again once the window or extension is up. A missing or
disabled upstream simply means no triggers of that kind fire.

Every upstream event goes through the runner's `deliver`, which captures the
first event as a sample, ignores unarmed triggers and fires armed ones.

Listener errors (including a store that throws while listing) never propagate
into the upstream that emitted the event, and one bad trigger never blocks the
rest. In legacy only NotificationSource had the listener guard; PageChangeSource
now has it too.

[FileWatchSource](FileWatchSource.md) is also a trigger source but does not
extend this base: it runs one fs watch per trigger, routes each event to exactly
one trigger and is driven by `reconcile()` on store changes, not by an upstream
appearing (see its doc). [WebhookSource](WebhookSource.md) does not extend it
either: it is an Express router where each request names one trigger, and it
calls the runner's `fire` (whose answer becomes the HTTP reply), not `deliver`.
