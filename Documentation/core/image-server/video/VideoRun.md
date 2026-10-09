# VideoRun

`core/image-server/video/VideoRun.js`

One video render on the local video slot. Extends
[LocalImageRun](../router/LocalImageRun.md) (and so
[ImageRun](../router/ImageRun.md)): settles once, holds the slot's idle unload,
forwards progress and base64 previews, aborts.

## Methods

- `new VideoRun({ i2v, send, notify, adapter, server, plan, wantId, cold, startedAt })`;
  `plan.params` goes to `adapter.generate`. The role is always `image-video`.
- `start()`, `abort()`, `finished` as ImageRun.
- Labels: `Generating video` (or `Animating image` when `i2v`), `Video generated`,
  `Video generation` (so `Video generation failed: <msg>` and `Video generation canceled`).
- Done: `markActive()`, a COLD / warm console line with frames, fps and encoder,
  `Video generated in <s>s`, then `done { video: { b64, mime (default
  video/webm), frameCount, fps, width, height, encoder }, modelId }`; resolves
  `{ success: true, video }` with the adapter's raw video.
- A result without `video.bytes` sends `error { message: 'video encode produced no
  output.' }`, notifies `Video generation failed: no output.` and resolves that error.

## Why

The ImageRun contract test pins image wording, so this class restates its cases in
its own test rather than running the contract.
