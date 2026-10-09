# TriggerDriftCheck

`core/llm-server/chat/trigger-runner/TriggerDriftCheck.js`

Payload drift on real deliveries ([PayloadDrift](../triggers/PayloadDrift.md)):
the run still goes ahead, but a shape that no longer matches the tested sample
is recorded, announced and, once per distinct change, notified, so a silently
wrong run is not the first sign.

## Methods

- `new TriggerDriftCheck({ triggerStore, emitEvent?, notify? })`.
- `note(trigger, event)`: null for triggers without a sample, page triggers,
  unreadable shapes and matching events (which also clear a recorded drift).
  Otherwise records the drift (`recordDrift`), emits `drift` `{ triggerId,
  title, note, isNew }` and `triggers-changed`, notifies `{ kind: 'drift',
  title: 'Trigger payload changed: <title>' }` for a new signature when the
  trigger's `notifyFailures` allows, and returns `shape drift: <description>`.
  The runner appends the note to the delivery detail.
