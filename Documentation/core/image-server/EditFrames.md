# EditFrames

`core/image-server/EditFrames.js`

Resolves a named edit frame (`match`, `square`, `portrait`, `landscape`, `tall`,
`wide`) to a pixel canvas for one model.

## Methods

- `EditFrames.resolveFrame({ frame, srcDims, native, grid = 64 })` returns
  `{ width, height, frame, scaled }`. Unknown or missing frames are `match`.
  Named frames get the model's native area at the frame's aspect. `match`
  follows the source size, pulled into the band [0.25, 1.2] x native area
  (`scaled: true` when pulled); an unreadable source gives the native canvas.
  A missing native canvas is 1024x1024; a grid of 1 or less is 64.
- `EditFrames.listFrames({ native, grid = 64 })` returns every frame as
  `{ frame, width, height, use }` for the agent's tool docs (`match` has null
  sizes).
- `EditFrames.sizeForAspect(aspect, area, grid)` returns the grid-aligned
  `{ width, height }` for an `[w, h]` aspect at about `area` pixels, never below
  one grid step per side.
- `EditFrames.ASPECTS`, `EditFrames.USES`, `EditFrames.NAMES` are the frame
  vocabulary, its use notes, and the ordered names.

## Why

An edit normally renders at the source's size, but a request that changes the
composition ("turn this head-shot into a full-body figure") needs a canvas
shaped for the new composition. Observed: a 400x400 face sketch came back as a
384x384 "full body". The chat agent cannot be trusted with raw pixels (it knows
neither the model's native area nor its latent grid), so it picks a name and the
size is resolved here from the router-supplied `{ native, grid }`.

Tiny `match` sources are scaled up because the model draws badly at 400x400 and
the user expects a usable picture; huge ones are scaled down so an attached 4K
photo never requests a 4K render.
