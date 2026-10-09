# SlidingWindowLayout

`core/llm-server/server/launch/SlidingWindowLayout.js`

Reads which layers of a GGUF model cache only a sliding window.

## Methods

- `SlidingWindowLayout.of(gguf)` returns `{ window, globalLayers, swaLayers, isSwaAt(i) }`
  or `null` when there is no window, no block count, nothing windowed, or the
  layout is unknown.
- `GEMMA2_PATTERN` (2), `GEMMA_PATTERN` (6).

## Why

Two header encodings exist. gemma4 writes `sliding_window_pattern` as one bool
per layer (true = windowed), used verbatim. gemma3-era headers write a scalar N:
layer i is windowed unless `(i + 1) % N == 0`, as llama.cpp reads it. Without
either, only the Gemma conventions are trusted (gemma2 alternates, later Gemma
runs 5 windowed per global); other architectures keep full-context pricing,
the conservative direction.
