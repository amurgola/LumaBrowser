# StateChangeHook

`core/shared/runtime/vram/StateChangeHook.js`

Subscribes a handler to a supervisor's `state-change` events (the
[BaseRuntimeServer](../BaseRuntimeServer.md) event) with an unsubscribe that
never throws.

## Methods

- `StateChangeHook.on(emitter, handler)` returns the unsubscribe. A null emitter
  or one without `on` yields a no-op. Unsubscribing uses `removeListener`, else
  `off`, and swallows errors.
- `StateChangeHook.EVENT` `'state-change'`.
