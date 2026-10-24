# ScreenTextReader

`extensions/desktop-integration/features/hotkeys/ScreenTextReader.js`

Reads the text in a screen capture with a chat model that can see images,
through the chat router's one-shot side completion (`complete` with `images`,
reasoning off, temperature 0; never stored as a message). Read aloud uses it
when nothing is selected ([HotkeyActions](HotkeyActions.md)).

- `new ScreenTextReader({ getRouter })`: `getRouter()` -> the
  `UnifiedChatRouter` or null, read per call.
- `available(modelRef?)`: the model a read would use
  (`router.resolveModelRef`: the given ref, else the chat's current model) can
  see images now (`router.modelVisionActive`: remote providers yes, a local
  model only while its server runs with the vision projector).
- `read(png, { modelRef?, timeoutMs? })` -> `{ success: true, text }` or
  `{ success: false, error, code }`: `NO_MODEL` (no router), `NO_VISION`,
  `EMPTY` (the model answered `NO_TEXT`), `TIMEOUT`, `FAILED`. The reply is
  cleaned like a rewrite (`SelectionRewriter.clean`).
- `INSTRUCTION`: transcribe in reading order, skip window chrome, reply
  `NO_TEXT` when there is none.
