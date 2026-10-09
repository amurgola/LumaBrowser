# PlacementTestTurn

`core/placement/service/PlacementTestTurn.js`

One timed tools-on chat turn of the placement test. One instance per turn.

## Methods

- `new PlacementTestTurn({ router, modelRef, artifactStore?, emit, clock? })`.
- `run(label, userMessage, conversationId)` emits `status { phase: 'run', label }`,
  dispatches `router.chat({ conversationId, modelRef, messages: [{ role: 'user',
  content }], userMessage, agent: true, tools: true, send })` and resolves once
  with `{ step, convId, imageId, error }` on the first of:
  - `done` (`'aborted'` when `payload.aborted`), `error` (`payload.message` or
    `turn failed`), a dispatch reply with `success: false` (`error` or
    `chat failed`), a rejection (its message or `chat failed`).
  Stream events: `meta` and `done` set the conversation id; `status` marks the
  tool start and re-emits `{ phase, label }`; `tool` marks progress; an
  `artifact` without a type or of type `image` becomes the turn's image.
  `step` = `{ label, ms, artifactId, ok, error, timing }` ([TurnMilestones](TurnMilestones.md)),
  also emitted as `step`. Without a streamed artifact the conversation's last
  image from `artifactStore.list(convId)` is used.

## Why

`UnifiedChatRouter.chat()` returns as soon as the turn is dispatched; the tool
calls run afterwards and end with a `done` or `error` event, so timing the
promise would read about 0 ms.
