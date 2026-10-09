# ModelFamilyTable

`core/llm-server/server/ModelFamilyTable.js`

Data only: the per-family launch recipes that model authors publish and the GGUF
header cannot tell us. Read through [ModelFamilies](ModelFamilies.md).

## Members

- `ModelFamilyTable.SAMPLER_CLI` maps body keys (`temperature`, `top_p`,
  `top_k`, `min_p`, `repeat_penalty`, `presence_penalty`) to llama-server CLI
  flags. Sampler defaults are written in body-key form because that is what the
  chat request path consumes; this map keeps launch and request from drifting.
- `ModelFamilyTable.FAMILIES` maps a family id to a profile:
  - `label`, `note` (one sentence for plan notes)
  - `architectures` (lowercased `general.architecture` values), `namePattern`
  - `samplerDefaults` (body-key form, every key must be in `SAMPLER_CLI`)
  - `flags` (valueless CLI flags)
  - optional `speculative { specType, draftNMax, label }`, `penaltyHostile`,
    `mtpDraftNMax`, `nativeToolCalls`, `nativeToolCallsCapable`,
    `nativeToolExclude`, `kvQuantUnsafe`, `ngramSpec`

The object is mutable on purpose: tests temporarily set `mtpDraftNMax`.

## Why each family is tuned the way it is

### muse-glimmer (Meta, Aug 2026)

Dense 29.6B with a 3:1 local:global attention mix, 2048-token sliding window,
131k native context.

- temp 1.0 / top_p 0.95 / top_k 64, from Meta's model card; llama.cpp's own
  defaults flatten this model's output.
- `repeat_penalty 1.0` (off) and `penaltyHostile`. The house anti-repetition
  sampler (1.1 over 256 tokens) also penalises control tokens, and this channel
  format re-emits `<|start|>`, `<|message|>`, `<|eom|>` many times per turn. At
  temperature 1.0 the sampler then picks a neighbour and the thinking block
  never closes. This is a property of the format, so the penalty stays off even
  on pinned-cold agent turns.
- `--jinja`: tool calls route through the model's own jinja template; without
  it they come back as raw text.
- `--reasoning-preserve`: llama-server asks for it on load; it keeps reasoning
  for the whole history, which an agent loop needs because every tool step is
  its own request.
- DFlash drafter (`draft-dflash`, n-max 15): Meta's block-diffusion drafter,
  shipped as a separate `dflash-*.gguf`. 1 anchor + 15 proposed tokens is the
  trained block size, and llama.cpp clamps higher values. Meta measures 3.1x on
  a 5090.
- Not set: `--swa-full` (the planner's generic SWA gate prices it), context or
  RoPE overrides (the planner never runs past trained context), KV quantisation
  (no published guidance).

### qwen38 (Alibaba Qwen3.8-27B, Aug 2026)

Dense 27B, 17 of 65 blocks carry KV, 262144 native context, MTP head grafted.

- Matched by name, not architecture: `qwen35` is shared by 3.5/3.6/3.8 and only
  3.8 publishes this sampler (3.6 recommends temperature 0.6).
- temp 1.0 / top_p 0.95 / top_k 20 / min_p 0.0. `min_p` is load-bearing: the
  shipped build defaults to 0.05, which truncates the tail the model was tuned
  on.
- Both penalties off, but NOT `penaltyHostile`: the objection is about
  temperature, so the chat router restores the house floor on pinned-cold turns
  (without it, two turns looped mid-`<think>`).
- `--jinja` and `--reasoning-preserve` as above (the preserve request was
  observed on this exact file).
- `nativeToolCalls: false`, `nativeToolCallsCapable: true`: re-graded
  2026-08-22, the text fence scored the same (100.0% vs 99.7%) with no
  off-format calls and ran 13% faster, since the ~3.2k-token tools array no
  longer rides every request.
- `nativeToolExclude: ['edit_artifact']`: natively it arrives as
  `arguments: "{}"` two or three times per edit turn, while the fence call lands
  first time.
- Not set: DRY (removed house-wide; it penalises faithfully copied ISBNs and
  URLs from tool results), `--swa-full` (not a sliding-window model),
  `--reasoning-effort` (effort is per request, not per process).

### qwen38-flash-next (Alibaba, Aug 2026, arch `qwen4exp`)

~125B total / ~6B active, 12 of 48 blocks keep KV, 512 routed experts, sparse
attention, 262144 context, no grafted MTP head.

- Detected by its own architecture.
- The thinking-mode sampler, same as the 27B.
- `kvQuantUnsafe`: a q8_0 KV cache makes it emit garbage (quantised KV enables
  Hadamard rotation, which the sparse-attention path asserts on). The KV is
  small here, so f16 costs a few GB even at 256k.
- `ngramSpec`: standalone model-free n-gram speculation is the only working
  speculative path (the draft-head PR regresses on multi-GPU CUDA). The planner
  caps it at n-max 4, measured +26% code edits / +10% prose.
- Not set: `nativeToolExclude` (the edit_artifact quirk was measured on the 27B
  only).
