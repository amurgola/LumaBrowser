# SetupHooks

`core/llm-server/ui/js/setup/SetupHooks.js`

The view callbacks a setup pipeline reports through.

## Methods

- `SetupHooks.from(opts)` returns `{ isCanceled, phase, setBar, sub }` from
  `opts.isCanceled`, `onPhase(text)`, `onBar(fractionOrNull, subText?,
  payload?)` (a `null` fraction is indeterminate) and `onSub(text)` (text only),
  with no-op defaults so pipeline code never null-checks them.
- `SetupHooks.during(subscribe, listener, action)` subscribes `listener`, awaits
  `action()`, and always unsubscribes (an unsubscribe that throws is ignored).

## Globals

None.
