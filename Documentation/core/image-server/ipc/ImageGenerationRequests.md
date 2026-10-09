# ImageGenerationRequests

`core/image-server/ipc/ImageGenerationRequests.js`

Runs renderer image requests through the shared ImageRouter and signals cancellation to extension pipelines.

## Methods

- `new ImageGenerationRequests(router)`.
- `generate(args, send)` `router.generate({ ...args, send })`; a throw sends `error { message }` and resolves `{ success: false, error }`.
- `abort()` increments `global.__lumaImageAbortSeq` and aborts the router.

## Why

The monotonic global lets long extension-owned pipelines stop scheduling their next stage after the active request is cancelled.
