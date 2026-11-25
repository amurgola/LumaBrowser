# HadamardRotation

`core/image-server/models/int8/HadamardRotation.js`

The normalised regular Hadamard rotation that "convrot" INT8 weights are stored under.

## Methods

- `HadamardRotation.rotateRows(values, rows, columns, group = 256)` rotates every row of a row-major
  `Float32Array` in place, one contiguous group of `group` values at a time, and returns it. Throws when a row
  cannot be split into such groups.
- `HadamardRotation.supports(columns, group = 256)` is true when `group` is a power of four that divides
  `columns`.
- `GROUP` (256): the group size ComfyUI and sd.cpp use ("H256").

## Why

sd.cpp rotates the activations of an INT8 convrot layer with this same transform at run time, and the matrix is
its own inverse, so rotated weights times rotated activations equal the original product. The rotation spreads
isolated large values over their group, which is what lets one 8-bit scale per row represent the row well. The
transform is the Kronecker power of the 4x4 regular Hadamard matrix, done as butterflies of stride 1, 4, 16 and
64 exactly as sd.cpp does (`src/core/cpu/int8.cpp`), so both sides agree to rounding.
