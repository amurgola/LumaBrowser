# HfModelFilter

`core/llm-server/models/HfModelFilter.js`

Keeps a Hub listing to models the chat server can actually run. The `gguf` tag on the Hub also covers embedders, rerankers, speech, music and diffusion graphs, and the most-downloaded order is full of them; this drops those, tags every row with how its Q4 quant would fit this machine, and on request hides the ones that would not fit at all.

## Methods

- `HfModelFilter.apply(rows, { hardware?, fit? })` for [HfModelSearch](HfModelSearch.md) rows: `{ results, hidden: { notChat, tooBig } }`. Every kept row gains `fit` (`{ tier, badge, label, speedLabel }` from [FitClassifier](FitClassifier.md) for a Q4 quant, `Q4_BYTES_PER_PARAM` 0.61 bytes per parameter, or null without a parameter count or hardware). `fit: true` also drops rows whose tier is `too-big`.
- `verdict(row)` `{ usable, reason? , projectorOnly? }`: hidden when the GGUF architecture is in `NON_CHAT_ARCHITECTURES` (bert family, whisper, parakeet, audiocpp, acestep, t5, flux, sd, wan and the like), the pipeline tag is in `NON_CHAT_PIPELINES` (feature-extraction, text-to-speech, automatic-speech-recognition, text-to-image, image-text-to-video and the like), or the repo name matches `NON_CHAT_NAMES` (mmproj, embed, rerank, whisper, tts, vocoder, vae, t5xxl, text-encoder as a word). An unknown architecture or tag keeps the row. `projectorOnly` marks a repo the Hub summarised by its vision projector (`clip`): it stays, but its facts are blanked since they describe the projector.
- `fitOf(row, hardware)` the Q4 fit, or null.

## Why

Vision chat models carry the `image-text-to-text` tag and some repos no tag at all, so the tag alone cannot select chat models; the architecture from the Hub's GGUF summary is the reliable signal, with the name as a last resort for companion repos. Hiding what is not a chat model and dimming what will not fit is what the user sees as "models that would work".
