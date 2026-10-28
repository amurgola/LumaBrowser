# RegionMaskData

`core/llm-server/ui/js/chat/region/RegionMaskData.js`

Pure pixel helpers behind the region editor: what a painted canvas's ImageData
says (coverage, bounds, blank) and the conversions between the translucent
paint the user sees and the white-on-black mask the backends take.

## Methods (all static)

- `coverage(imageData)`: the share of pixels with alpha at or above
  `PAINTED_ALPHA` (128).
- `isBlank(imageData)`, `bounds(imageData)` (`{ x, y, width, height }` or null).
- `maskPixels(imageData)`: opaque white where painted, opaque black elsewhere.
- `paintPixels(maskImageData, rgba)`: the reverse, for re-editing a region.
