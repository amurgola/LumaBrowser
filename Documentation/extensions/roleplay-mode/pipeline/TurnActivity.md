# TurnActivity

`extensions/roleplay-mode/pipeline/TurnActivity.js`

What the page shows under a reply while its world updates and after.

## Methods

- `new TurnActivity(emit, messageId)`; fields `status`, `label`, `steps`,
  `changes`.
- `begin()` (working), `step(label)` (up to 12 distinct steps), `done(changes)`
  returns the record kept on the reply's [timeline](../timeline.md) point
  `{ status: 'done', steps, changes, at }`, `stopped(text)`, `failed(text)`
  (both only while working).
- Every update emits `mode:activity { messageId, status, label, steps, changes }`;
  a missing or throwing emit is ignored.
