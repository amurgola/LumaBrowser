# ImageLoraSpecs

`core/image-server/router/ImageLoraSpecs.js`

Builds sd-server's structured `lora` request entries from a model's declared LoRAs.

## Methods

- `ImageLoraSpecs.resolve(md, lorasDir)` maps `md.loras` (`[{ name, weight?, highNoise? }]`)
  to `[{ path, multiplier, is_high_noise? }]`, or `null` when none are declared.
  Nameless entries are skipped. `path` uses forward slashes and keeps a known
  extension (`KNOWN_EXTS`: .safetensors, .gguf, .pt, .pth); otherwise the real
  one is looked up in `lorasDir`, falling back to `.safetensors`. A non-finite
  weight is 1.0. `highNoise: true` adds `is_high_noise: true`.

## Why

sd-server ignores `<lora:name:weight>` prompt tags in every server API; they
would reach the text encoder as junk tokens. It only accepts explicit entries
whose `path` is relative to `--lora-model-dir`, extension included, matched
against its lora cache. `name` is the filename without extension (the app-wide
convention), so the extension is resolved here. `is_high_noise` routes a LoRA to
Wan 2.2's high-noise expert; the Lightning 4-step pairs need one of each.
