# RenderJobSource

`extensions/desktop-integration/features/jobs/sources/RenderJobSource.js`

Image, video and music generation. The routers published as
`global.__lumaImageRouter`, `__lumaVideoRouter` and `__lumaMusicRouter`
(`core/image-server/ImageRouter.js`, `VideoRouter.js`,
`core/music-server/MusicRouter.js`) are the single entry point of every render:
the chat UI, the chat agent's tools, `context.chat.generateImage`, Network
Sharing. Each has `generate({ ..., send })` and `abort()`.

- `start()` wraps `generate` on each router instance (an own property). Routers
  missing at start (published later in boot) are retried every 2 s until all
  three are wrapped.
- The wrapper starts a job (`image`, `video` or `music`; title with the prompt's
  first 48 characters), tees `send` so it sees `progress { step, totalSteps }`
  (progress and "Step n of m") and `status { phase }` (detail), passes every
  event and the result through unchanged, and finishes the job from the result:
  `success` -> done, `aborted` (or a cancel) -> canceled, else failed with
  `error`. A throw fails the job and is re-thrown.
- Cancel = `router.abort()`. A new render on the same router aborts the
  previous one, which then finishes as canceled.
- `stop()`: deletes the wrapper when it is still on the instance (the prototype
  method shows through again), restores a pre-existing own `generate`, and when
  another wrapper was stacked on top, turns ours into a pass-through.

Music reports no step progress (only elapsed time), so music jobs are
indeterminate.
