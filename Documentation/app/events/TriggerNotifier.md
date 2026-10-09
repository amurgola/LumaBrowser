# TriggerNotifier

`app/events/TriggerNotifier.js`

The desktop notification TriggerRunner raises for a failed, auto-paused,
drifting or approval-waiting trigger run.

## Methods

- `new TriggerNotifier({ db, notice, showWindow, openLlmTab, emitOpen, setTimeoutFn? })`.
- `notifier()` the `notify` function TriggerRunner takes.
- `notify({ title, body, triggerId })` returns whether a notification showed.
  Nothing when `core.triggers.notifyFailures` is `false`. The body is capped at
  240 characters. Clicking it raises the window, activates the pinned LLM tab
  and, 400 ms later, emits `open` `{ triggerId }` so the chat opens that
  trigger's runs view. Each click step is isolated.
