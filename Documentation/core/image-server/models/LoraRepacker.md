# LoraRepacker

`core/image-server/models/LoraRepacker.js`

Adds sd.cpp-internal alias tensors to a diffusers-form Qwen-Image 2.1 LoRA so
its `img_mlp.gate_layer` / `img_mlp.proj` adapters apply against the fused
`img_mlp.gate_up` weight of leejet's GGUF quants.

## Methods

- `LoraRepacker.fusedMlpAlias(key)` returns the alias name for a
  `transformer.transformer_blocks.N.img_mlp.(gate_layer|proj).lora_(A|B).weight`
  key, or `null`. `gate_layer` maps to `gate_up.weight`, `proj` to
  `gate_up.weight.1`; `lora_A` to `lora_down`, `lora_B` to `lora_up`, all under
  `lora.model.diffusion_model.`.
- `LoraRepacker.needsFusedMlpAliases(headerOrKeys)` is true when the keys (or a
  header object) carry gate/proj adapters and no alias yet.
- `LoraRepacker.repackFusedMlpAliases(srcPath, destPath)` writes the repacked
  file and returns `{ repacked, tensors, aliases }`; `repacked: false` writes
  nothing. Throws on a non-safetensors file.
- `LoraRepacker.repackInPlaceIfNeeded(filePath)` repacks through a sibling temp
  file renamed over the original. Never throws: returns `{ repacked: false }`,
  `{ repacked: true, aliases }`, or `{ repacked: false, error }` with the
  original untouched.

## Why

leejet's GGUF quants fuse Qwen-Image 2.1's two MLP input projections into one
`gate_up` tensor, and sd.cpp follows whichever layout the weights have. A
diffusers/PEFT LoRA (Viggle turbo, alibaba-pai Fun-Acc, Civitai 2.1 LoRAs)
targets the two separate names, so sd.cpp dropped every MLP-input adapter: 128
of Viggle's 454 tensors ("Only (326 / 454) LoRA tensors have been applied",
measured 2026-09-24).

sd.cpp already applies several LoRA slices to one fused weight: for `X.weight`
it looks up `lora.X.weight.lora_*`, then `lora.X.weight.1.lora_*`, and
concatenates the deltas along the output dim (that is how SDXL CLIP-G in_proj
q/k/v LoRAs work). The fused tensor is `[gate ; proj]`, gate first.

Originals are kept (bytes duplicated, about +28% for the Viggle r128 file) so the
same library file still applies fully to an unfused 2.1 checkpoint; whichever
half does not match is reported unused. PEFT files keep `lora_alpha` only in
metadata (equal to rank for Viggle), and sd.cpp scales 1.0 without an alpha
tensor, so the aliases need none. Tensor data is copied in file order through an
8 MB buffer, so a 1.3 GB r256 file never sits in memory.
