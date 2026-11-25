# Int8ConvrotLayer

`core/image-server/models/int8/Int8ConvrotLayer.js`

Turns one linear layer's weights into the ComfyUI `int8_tensorwise` convrot form.

## Methods

- `Int8ConvrotLayer.quantize(values, rows, columns, group = 256)` takes the layer as a row-major `Float32Array`
  (rows are output features; it is consumed in place) and returns `{ codes, scales }`: an `Int8Array` of
  `rows x columns` codes and a `Float32Array` with one scale per row.

## Why

Each row is rotated ([HadamardRotation](HadamardRotation.md)) and rounded to signed 8-bit codes with
`scale = largest magnitude / 127`, the rule sd.cpp documents for this format (`docs/int8_convrot.md` there). An
all-zero row keeps scale 0. Measured on Anima the weights come back within 0.84% of the originals, against 11%
for 4-bit, which is why INT8 is the format the app builds.
