# ImageCapability

`extensions/game-mode/assets/ImageCapability.js`

What image generation can do right now through `context.chat`.

## Methods

- `isReady(chat)` `chat.isImageReady()`, false on error.
- `canGenerateInline(chat)` ready AND at least two CUDA GPUs (`CudaDeviceProbe.gpuCount()`); [AssetRenderQueue](AssetRenderQueue.md) renders after the reply either way, and only on one GPU wraps the render in the exclusive-image window (which stops the LLM to free the card); [RuntimeAssetGenerator](RuntimeAssetGenerator.md) uses it for play-time images.
- `nativeSize(chat, modelRef)` `chat.imageNativeSize` as `{ width, height }` or null.
- `beginExclusive(chat)`, `endExclusive(chat)` best-effort wrappers.
