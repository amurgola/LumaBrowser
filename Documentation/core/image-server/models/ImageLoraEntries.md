# ImageLoraEntries

`core/image-server/models/ImageLoraEntries.js`

Data-only class holding the curated LoRA rows. Read it through
`ImageLoraCatalog`; the shape and per-entry reasoning are documented in
[ImageLoraCatalog.md](ImageLoraCatalog.md).

## Members

- `ImageLoraEntries.ENTRIES` is the ordered row table: Viggle Qwen-Image 2.1
  turbo, two MiniMax-H3 Turbo checkpoints, the Wan 2.2 Lightning T2V and I2V
  pairs, and three game-asset style LoRAs (pixel art, seamless texture, sprite
  sheet).
