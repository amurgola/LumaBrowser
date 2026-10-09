# ChatImageGenerator

`core/shell/extensions/ChatImageGenerator.js`

Server-side image generation for extensions through the core ImageRouter
(`context.chat.generateImage` / `abortImage`).

## Methods

- `new ChatImageGenerator({ router = ExtensionGlobals.imageRouter, lab = LabHarness.current })`
  (getters read at call time).
- `generate(opts)` resolves `{ b64, mime, width, height, seed }` or null and never
  rejects. `opts` are ImageRouter.generate options plus optional `onStatus`,
  `onProgress`, `onPreview` callbacks. Runs one [ImageGenerationRun](ImageGenerationRun.md),
  with the Lab harness only when it is `active`.
- `abort()` aborts the router's render; never throws.
