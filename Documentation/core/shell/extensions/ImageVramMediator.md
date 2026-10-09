# ImageVramMediator

`core/shell/extensions/ImageVramMediator.js`

Gives image generation the GPU on single-GPU machines, behind
`context.chat.beginExclusiveImage()` / `endExclusiveImage()`.

## Methods

- `ImageVramMediator.shared` the process-wide instance (one reference count for all extensions).
- `new ImageVramMediator({ gpuCount, llmService, imageService, startLlm, delayMs = 6000 })`, all optional (tests).
  Defaults: `CudaDeviceProbe.gpuCount`, ExtensionGlobals, `ServerLauncher.shared.resolveAndStart`.
- `begin()` (async) counts a holder; the first holder stops the local LLM server
  when it is `ready` or `starting`.
- `end()` releases; when the count reaches zero it waits `delayMs` (coalescing
  back-to-back images), then stops the generate and edit image servers and
  restarts the LLM if it had been running. A `begin()` inside the wait cancels it.
- Both are no-ops with two or more CUDA cards (servers are pinned to separate cards).

## Why

Modes such as roleplay generate images after the text turn, so the LLM can be
stopped and the image model run fully on-GPU instead of spilling to RAM. Never
use it mid agentic loop, where the LLM is needed.
