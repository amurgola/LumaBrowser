# ImageOps

`core/browser/vision/ImageOps.js`

The image operations visual grounding needs, over Electron's `nativeImage`, always in true pixels.

## Methods

- `new ImageOps(nativeImage)` takes Electron's `nativeImage` module (injected so tests can fake it).
- `normalize(image)` rebuilds any captured or loaded image from its own PNG bytes as a scale-1 image.
- `fromPngBase64(base64)` decodes a base64 PNG into a scale-1 image.
- `size(image)` returns `{ width, height }`. Only valid on images that came through this class.
- `resize(image, width, height)` resizes with `quality: 'best'` and re-normalizes.
- `crop(image, rect)` crops to the rounded rectangle and re-normalizes.
- `toDataUrl(image)` encodes as a `data:image/png;base64,...` URL.
- `ImageOps.pngSize(buffer)` reads width/height from a PNG's IHDR chunk (bytes 16-23); throws
  `pngSize: not a PNG buffer` otherwise.

The instance is the `imageOps` dependency [GroundingClient](GroundingClient.md) expects (`size`, `resize`, `crop`,
`toDataUrl`).

## Why normalize everything

`capturePage()` returns a nativeImage tagged with the display's scale factor, so `getSize()` answers
in DIP while `toPNG()` emits physical pixels. That mismatch is the classic "the click lands 1.5x off".
Re-creating every image from its own PNG bytes yields a scale-1 bitmap whose size is its pixel size,
so size, resize and crop all speak one unit. `size` then skips re-encoding a PNG just to read two
integers.
