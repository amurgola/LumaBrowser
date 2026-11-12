# ImageLoraEntries

`core/image-server/models/ImageLoraEntries.js`

Data-only class holding the curated LoRA rows. Read it through
`ImageLoraCatalog`; the shape and per-entry reasoning are documented in
[ImageLoraCatalog.md](ImageLoraCatalog.md).

## Members

- `ImageLoraEntries.ENTRIES` is the ordered row table: Viggle Qwen-Image 2.1
  turbo, two MiniMax-H3 Turbo checkpoints, the Wan 2.2 Lightning T2V and I2V
  pairs, three game-asset style LoRAs (pixel art, seamless texture, sprite
  sheet) and the Krea 2 General Edit V2 edit LoRA (`enablesEdit`: neither a
  speed preset nor a trigger; it gives Krea 2 Turbo an instruction-edit mode
  and is non-commercial under its author's licence).
