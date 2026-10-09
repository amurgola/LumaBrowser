# EditCanvas

`core/llm-server/chat/bridge/tools/media/EditCanvas.js`

Sizes edit_image's canvas from a named frame.

## Methods (all static)

- `requestedFrame(params)`: a valid `EditFrames.NAMES` entry (trimmed,
  lower-cased) or `match`.
- `resolve({ frame, srcDims, choice, imageRouter })`: `{ width, height, frame,
  scaled }`. Remote editor: `EditFrames.resolveFrame` on the generic band (grid
  64); edit-capable: on `imageRouter.getFrameSizes(editModelId)`; otherwise (or
  on failure) the source shape rounded down to 64 and clamped to 256..1024
  (512 when unknown).
