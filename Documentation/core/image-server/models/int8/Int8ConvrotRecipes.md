# Int8ConvrotRecipes

`core/image-server/models/int8/Int8ConvrotRecipes.js`

The model families whose diffusion weights have been tested as INT8 convrot.

## Methods

- `Int8ConvrotRecipes.forFamily(family)` returns `{ layerPattern }` (a RegExp over safetensors weight names) or
  `null` for a family with no tested recipe.

## Why

Which layers are safe to convert is a property of the architecture, and a family is listed only after its INT8
images were compared with the 16-bit ones. Anima converts the MLP and attention projections of its 28 transformer
blocks (280 tensors, 98% of the weights) and keeps the embedders, the text adapter, the norms and the final layer
in 16-bit. Its checkpoints name the blocks `net.` or `model.diffusion_model.` depending on the exporter, so the
pattern accepts both.
