# ImageCapability

`extensions/game-mode/assets/ImageCapability.js`

What image generation can do right now through `context.chat`.

## Methods

- `isReady(chat)` `chat.isImageReady()`, false on error.
- `canGenerateInline(chat)` ready AND at least two CUDA GPUs (`CudaDeviceProbe.gpuCount()`); on one GPU the exclusive-image window would stop the LLM mid-turn, so generation waits until after the turn.
- `nativeSize(chat, modelRef)` `chat.imageNativeSize` as `{ width, height }` or null.
- `beginExclusive(chat)`, `endExclusive(chat)` best-effort wrappers.
