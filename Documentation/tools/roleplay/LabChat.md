# LabChat

`tools/roleplay/LabChat.js`

The roleplay extension's `context.chat` outside the app: side calls (the
stage, casting, consolidation, pressure, the judges) go to the Lab router's
own completion exactly as the app's chat surface sends them, with the
installed `LabHarness` consulted first (mocked side calls), and the image side
answers "not ready" so the reaction does its memory work and stops.

## Methods

- `new LabChat({ router, Harness })`.
- `complete(opts)` mirrors `ChatSurface._complete`: the harness's
  `completeMock` when one is installed and active, else `router.complete`;
  an exception becomes `{ error }`.
- `isImageReady()` false, `visionAvailable()` false, `generateImage()` null,
  `beginExclusiveImage`, `endExclusiveImage`, `warmImageSlot`, `registerMode`
  (no-ops), `uiUrl(rel)`.

## Why

The narrator is a chat turn and never passes through here; only the mode's
side calls do, and they must reach the same `SideCompletion` (thinking off,
the no-think directive, the model's overrides) the app's do.
