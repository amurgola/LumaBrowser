# LumabyteChat

`extensions/desktop-integration/features/lumabyte/LumabyteChat.js`

One grounded turn.

- `capabilities()` -> `{ ready, vision, visionLoads, canAct, actReason, canRead, model, reason }`: the model a
  turn would use (`router.resolveModelRef` of the `model` setting) and whether a
  screenshot would be seen (`router.modelVisionSupport`, see
  `ModelCapabilities.visionSupport`): a local model whose projector is not loaded
  yet, or whose server has not started, counts (`visionLoads`: the first image
  loads it). An older router falls back to `modelVisionActive`.
- `send(att, text, emit)` -> `{ abort() }`. Emits `status` ("Looking at the
  window", then "Thinking" with `seen: { screenshot, text, notes }`), `delta`,
  `reasoning`, then `done { text, aborted }` or `error { error }`. Reads the
  window ([WindowContext](WindowContext.md); the screenshot only when the model
  can see), sends `systemPrompt` + the app's last `HISTORY_MESSAGES` (20) as
  text + the new message with the window context (`userMessage`), with the
  screenshot as the turn's image, through `router.completeStream` (reasoning
  off unless the `thinking` setting is on, `TIMEOUT_MS` 240 s). The user's text
  and the cleaned reply are saved to the app's thread; the window context is not.
- Acting: with `capabilities().canAct` (the `actions` setting on and desktop
  control allowed) the system prompt explains the actions block
  ([LumabyteActions](LumabyteActions.md)) and the window text comes from
  desktop control (numbered refs). A reply that is a block is never streamed:
  it runs on the window (`step` events), Lumabyte looks again and sends the
  result (`followUp`), up to `MAX_STEPS` (6), until the model answers in plain
  text. The saved reply starts with the actions taken, e.g. `(Double-click [12])`.
  Without acting the prompt says why, and a stray block becomes a plain
  explanation (`plainText`).
- Reading: with `canRead` (the `files` setting on) the block may also `read` a
  file or folder ([LumabyteFiles](LumabyteFiles.md)), with or without desktop
  control (`static types(caps)` lists what a reply may use). Each look on File
  Explorer adds the open folder and selection (`[Open folder: ...]`,
  `[Selected: ...]`), so a bare name like `Andy.md` resolves; what was read goes
  into the `followUp`.
- `static systemPrompt(ctx, { vision, canAct, actReason, canRead, maxActions })`, `static userMessage(prompt, ctx)`,
  `static followUp(prompt, report, ctx, outputs)`, `static clean(text)`.
