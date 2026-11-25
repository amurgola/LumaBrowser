# TensorFloats

`core/image-server/models/int8/TensorFloats.js`

Decodes the raw bytes of a safetensors tensor into 32-bit floats.

## Methods

- `TensorFloats.decode(bytes, dtype)` returns a new `Float32Array` for a little-endian `BF16`, `F16` or `F32`
  buffer (a `Buffer` or `Uint8Array`, also a view into a larger buffer). Throws `Unsupported weight type <dtype>.`
  for anything else.
- `TensorFloats.supports(dtype)` says whether `decode` takes the type.

## Why

Diffusion checkpoints store their weights in one of these three types (Anima ships BF16; community finetunes
come as F16 or F32). BF16 is the upper half of a 32-bit float, so shifting it back in is exact; F16 is expanded
by its sign, exponent and fraction.
