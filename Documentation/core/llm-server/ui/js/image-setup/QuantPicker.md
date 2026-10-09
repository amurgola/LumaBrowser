# QuantPicker

`core/llm-server/ui/js/image-setup/QuantPicker.js`

The image catalog's quant picker over `files.diffusion.quants`.

## Methods

- `quantsFor(model)` (null below two rungs), `catalogDefaultId(quants, diffusion)`, `defaultId(model, vramBytes)` (largest quant that fits, else the catalog default), `totalBytes(model, quantId)`, `html(model, vramBytes)`, `selected(id, doc?)` (read back off `#imgQuant-<id>`).

## Globals

None.
