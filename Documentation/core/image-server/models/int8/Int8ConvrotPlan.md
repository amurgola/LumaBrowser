# Int8ConvrotPlan

`core/image-server/models/int8/Int8ConvrotPlan.js`

Lays out an INT8 convrot copy of a safetensors checkpoint. Pure bookkeeping: no file is opened.

## Methods

- `Int8ConvrotPlan.build(sourceHeader, layerPattern)` returns `{ header, entries, dataBytes, layers }`. `header`
  is the copy's safetensors header. `entries` say how to fill it, with offsets relative to the start of the
  tensor data: `copy { sourceOffset, length, targetOffset }`, `layer { name, dtype, rows, columns, sourceOffset,
  length, codesOffset, scalesOffset }` and `bytes { bytes, targetOffset }` (the quantisation config).
- `Int8ConvrotPlan.converts(sourceHeader, name, layerPattern)`: a tensor is converted when its name ends in
  `.weight` and matches the pattern, it is a two-dimensional BF16, F16 or F32 tensor whose rows can be rotated in
  groups of 256, and the file carries no `weight_scale` or `comfy_quant` for it already.
- `Int8ConvrotPlan.quantConfigBytes()`: the JSON `{ format: 'int8_tensorwise', convrot: true,
  convrot_groupsize: 256 }` sd.cpp reads from `<module>.comfy_quant`.

## Why

A converted layer becomes three tensors (`<module>.weight` as I8, `<module>.weight_scale` as F32 `[rows, 1]`,
`<module>.comfy_quant` as U8); everything else keeps its type and bytes. Every size is known before any work is
done, so the header can be written first and each tensor written at its own offset as soon as it is ready, in any
order. Tensors follow the source file's order with no gaps, as the format requires.
