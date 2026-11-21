# LoopCoreLayout

`core/llm-server/server/launch/LoopCoreLayout.js`

Reads a looped model's core from the GGUF header, so the KV cache is priced
once per pass through each core block.

## Methods

- `LoopCoreLayout.of(gguf)` returns `{ start, end, passes, extraSlots,
  visitsAt(i) }` from `gguf.loopCore` (the header's `<arch>.loop.start`,
  `loop.end` and `loop.count`; `end` is exclusive), or `null` when the model has
  no core, fewer than two passes, or a core outside its blocks.
- `LoopCoreLayout.visitsAt(gguf, i)` is how many times block `i` runs per
  token: the pass count inside the core, else 1.

## Why

Inkling 2 Mini (`inkling2_loop`, November 2026) stores 24 blocks but runs blocks
6 to 17 three times, 48 block visits per token, and llama.cpp gives every visit
its own KV and convolution cache (`n_slot = n_layer + (passes - 1) x (end -
start)`). Pricing the 24 stored blocks counted half the KV: at 32k context with
an f16 cache the four global layers become eight global visits and the twenty
windowed ones forty, so the estimate missed about 0.6 GiB at 32k and 4 GiB at
256k. [KvCacheSizer](KvCacheSizer.md)
multiplies each block by `visitsAt`. Weight placement still counts stored
blocks, because the passes share one set of weights.

The research variant (TML-d24-varloop-research) carries `loop.varying` and a
pass count chosen at load; the header count is what the planner prices.

## rewindsByCheckpoint (2026-11-20)

`LoopCoreLayout.rewindsByCheckpoint(gguf)`: true for a model with a loop core.
llama.cpp keeps a recurrent state per pass for such a model, so the server
cannot rewind its cache part of the way: when a request diverges from the
cached prompt it restores a context checkpoint or reads everything again
("forcing full prompt re-processing due to lack of cache data (likely due to
SWA or hybrid/recurrent memory)"), whatever the window cache holds. The
full-size window cache (`--swa-full`) therefore buys no reuse there.

Measured on Inkling 2 Mini IQ4_NL (b12600, RTX 5090, 32k, q8_0 KV): six
chained requests of one chat turn, replayed against a bare server.

| | with `--swa-full` | without |
|---|---|---|
| 26.4k token prompt, first read | 44.2 s (597 tok/s) | 18.4 s (1,437 tok/s) |
| tokens reused on the five later requests | 0, 27,083, 0, 28,828, 21,138 | the same five numbers |
| KV cache | 3,264 MiB | 672 MiB |
| decode | 58 tok/s | 58 tok/s |

[OffloadDecision](OffloadDecision.md) never chooses `--swa-full` for such a
model and [MicroBatchPlan](MicroBatchPlan.md) prices it with the windowed
cache.
