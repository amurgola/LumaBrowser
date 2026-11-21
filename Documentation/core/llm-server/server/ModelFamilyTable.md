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
  - optional `speculative { specType, draftNMax, label }` (where to download the
    drafter is [DrafterCatalog](../models/DrafterCatalog.md)'s business), `penaltyHostile`,
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

### deepseek4 (DeepSeek V4 and V4.1, archs `deepseek41`, `deepseek4`; name fallback `DeepSeek-V4*`)

V4.1-Flash-1017: 552B MoE, 40 layers, 384 experts with 6 routed plus 1 shared,
an MXFP8 Engram table, 1M native context; runs through the LumaByte runtime
(patch 0005, PR 30817).

- Detected by architecture first, else by a `DeepSeek-V4` / `DeepSeek V4.1`
  name; V3.2 is left out on purpose (no measured recipe).
- `nativeToolCalls: true` with `--jinja`: the model is trained on its DSML
  markup (`<｜DSML｜ calls>` with a leading space in every tag on V4.1) and emits
  it whatever the text fence asks for; llama-server parses it into `tool_calls`
  only through the jinja path with tools registered on the request. On the
  fence path (2026-11-04) the call arrived in the chat as raw text and nothing
  ran; [DsmlToolCallParser](../chat/bridge/parsing/DsmlToolCallParser.md) now
  recovers that shape as well, as a backstop.
- Not set: sampler defaults (DeepSeek publishes none for the 1017 release),
  `--reasoning-preserve` (not measured on this template), KV quantisation.

### gemma4 (Google Gemma 4, arch `gemma4`; name fallback `gemma-4`, `Gemma 4`)

Added 2026-11-18. E2B, E4B, 26B A4B and 31B, and finetunes of them (the
architecture is in the header, so a renamed finetune is matched too).

- Detected by architecture first, else by a Gemma 4 name. The name pattern is
  not anchored on a word boundary because bartowski's files are named
  `google_gemma-4-...`; `gemma-3-*` and `gemma-40b` stay unclaimed.
- `samplerDefaults` temperature 1.0, top_p 0.95, top_k 64: what the model card
  of `google/gemma-4-E4B-it` recommends (`npm run models:card-settings --
  --repo bartowski/google_gemma-4-E4B-it-GGUF --model
  google_gemma-4-E4B-it-Q4_K_M --dry-run` prints it).
- `nativeToolCalls: true` with `--jinja`: the model is trained on its own
  tool-call tokens and falls back to them on a long call whatever the text
  fence asks for. Measured on Gemma 4 E4B Q4_K_M with the prompt bench
  (`npm run bench:prompt`, the three long tool-call cases, ten trials each):
  27 of 30 on the text fence (twice `<|tool_call>call:create_live_artifact{...}`
  arrived in the chat as raw text and nothing ran, once the document was
  pasted into the reply with no call) against 30 of 30 with tools registered.
  The cost is the registered schemas: a fresh Tools-on request is about 8,500
  tokens natively against 6,400 on the fence.
- How that cost moves through a conversation, measured the same day on an
  eight-turn chat that brought in the artifacts, web and live-artifacts groups
  one after another (two runs per route, within 60 tokens of each other): the
  gap stays at 2,111 tokens while no group joins, and is 2,076, 2,164 and
  about 2,480 after each group, because a group's schemas join the array while
  its manual loses the fence examples. The larger effect is on the cache. On
  both later activations the reused prefix stopped at the same 8,172 tokens,
  the tool block, so everything after it (the whole conversation) was read
  again: 6,030 tokens against 3,190 on the fence at the third activation,
  where the fence route reads only the new tail. It is paid once per group.
- Not set: `--reasoning-preserve` (not measured on this template), KV
  quantisation, speculation.

### ricursive (ricursiveAI Ripple, arch `ricursive`; name fallback `Ripple-NNB`)

Ripple-65B-Preview: dense 65B, 80 layers, four sliding-window layers (window
1024, RoPE) to one full-attention layer without positional encoding, gated
attention, a per-layer value residual, clamped SwiGLU, 1M context. Mainline
llama.cpp does not know the architecture; it loads only on the LumaByte
runtime from luma-b7 (patch 0011), where the GGUF conversion also lives.

- Detected by architecture first, else by a `Ripple-65B` style name (a size
  suffix is required so unrelated "ripple" names stay unclaimed).
- `--jinja` with `nativeToolCalls: false`: the tokenizer ships a plain ChatML
  template (`<|im_start|>role ... <|im_end|>`) with no tool markup, so the
  jinja path renders it faithfully and tools go through the text fence.
- Not set: sampler defaults (none published), `--reasoning-preserve` (the
  template has no reasoning channel), KV quantisation, speculation.

### inkling2 (Thinking Machines Inkling 2, archs `inkling2_loop`, `inkling2`; name fallback `Inkling-2`)

Added 2026-11-20. Inkling 2 Mini: 26.4B MoE, about 3.4B active (5.4B counting
the loop), 24 stored blocks of which 6 to 17 run three times (48 visits per
token, each with its own KV), 128 experts with 8 routed, five 1024-token
sliding-window layers per global one, no RoPE (learned relative positions),
1M context, image input through an mmproj, Apache 2.0. `inkling2` is Inkling 2
Small, same template; it is listed so a renamed file still matches, but only
the Mini was run here.

- Mainline llama.cpp knows both architectures from PR 32694 (merged
  2026-11-20 as 29b52d398, build 12600). The LumaByte runtime (luma-b8, pinned
  at b11721) does not: it fails with "unknown model architecture", which
  [FailureInterpreter](FailureInterpreter.md) now reports as a runtime that is
  too old rather than a damaged file.
- `samplerDefaults` temperature 1.0, top_p 1.0, top_k 0, min_p 0.0, both
  penalties off: `generation_config.json` samples at temperature 1.0 with no
  truncation and no penalty, and Unsloth's guide lists the same four values.
- `--jinja`: llama.cpp detects the template (`<|message_user|>` plus
  `<|content_image|>`) and uses its own Inkling parser, which splits the turn's
  `<|content_thinking|>`, `<|content_text|>` and
  `<|content_invoke_tool_json|>` blocks into reasoning, content and tool calls.
- Thinking effort rides `reasoning_effort` in the template (none, minimal,
  low, medium, high by default, xhigh, max, or a number), rendered as a
  "Thinking effort level: 0.2" system block; the app's template probe finds
  the levels, nothing is set here. Raw `reasoning_effort: none` still reasons
  (the model card says so too); the app's Off turn came back with no
  reasoning.
- `nativeToolCalls: true`, `nativeToolCallsCapable: true`. The first live run
  on 2026-11-20 drove the browser on both routes ("open example.com and tell
  me the heading"): the fence answered right after navigate plus get_source,
  the native route took five calls and then said the page had no h1, so the
  fence was the first default. A real turn the same day showed the fence does
  not hold: with a 21k token prompt (the dashboard attached, tool groups to
  activate) the model answered with its own block,
  `activate_tools<|content_invoke_tool_json|>{"name":"activate_tools",...}`,
  whatever the prompt asked for, and llama.cpp's Inkling parser drops that
  block when the request declares no tools (also with
  `parse_tool_calls: false` and `reasoning_format: none`), so the reply came
  back empty three times running. On the native route the same turn
  activated the Hub tools, read the contact and the conversation and
  answered. At first that cost a full prompt re-read (about 50 s) at every
  group loaded mid-turn, because the schema joined the `tools` array and the
  template renders tools before the system prompt; the array is now fixed for
  the conversation and such tools run through `call_tool`
  ([NativeToolPlan](../chat/bridge/tools/NativeToolPlan.md)). The same turn
  went from 241 s to 89 s with that and the `--swa-full` change below.
- No `--swa-full`: the model rewinds by checkpoint, so the full-size window
  cache brought no reuse while reading a 26k token prompt at 597 tok/s
  against 1,437 without it and holding 2.6 GiB more at 32k
  ([LoopCoreLayout](launch/LoopCoreLayout.md)`.rewindsByCheckpoint`).
- What is left of a step's time is the server's own: it tokenises the whole
  prompt again on every request (1.9 s for 88k characters, 26.6k tokens, with
  this vocabulary), and prompt reading still slows with depth.
- KV is priced once per pass through the loop core; see
  [LoopCoreLayout](launch/LoopCoreLayout.md). Measured with
  `npm run bench:llm-launch` on the RTX 5090 (IQ4_NL, 32k, f16 KV,
  `--swa-full`): about 21.6 GiB in use for an estimate of 22.9 GiB; the
  per-block count would have said 19.9.
- The compute buffer holds an attention mask per block pass and grows with
  the context (3.4 GiB at 32k, 6.7 GiB at 64k with q8 KV, where the card
  measured 23.0 and 28.9 GiB in all), which the estimate above did not count.
  [LayerMaskCost](launch/LayerMaskCost.md) prices it and
  [MicroBatchPlan](launch/MicroBatchPlan.md) steps `-ub` down to keep the
  model whole on one card: a two-card split of this model decodes at 15 to 26
  tok/s against 63 to 72 whole.
- Live numbers on the RTX 5090 (IQ4_NL, 32k, q8 KV): load about 10 s, decode
  62 to 76 tok/s, prompt about 1,500 tok/s; prefix reuse works (8,752 of 9,215
  prompt tokens cached on a tool step).

## Qwen3.8 DFlash2 drafter (2026-11-08)

`qwen38` carries `speculative { specType: draft-dflash, draftNMax: 7, label: DFlash2 }`;
the drafter catalog names `z-lab/Qwen3.8-27B-DFlash2-GGUF` as its source. Measured on an RTX 5090 with the unsloth
UD-Q6_K_M weights at temperature 0: 140 tok/s aggregate with the DFlash2 Q8_0 drafter,
110 with the grafted MTP head (the previous default), 58 plain; at 128k context with
q8_0 KV the drafter still led or matched MTP at every depth. The Tencent DSpine
drafter (block 16) was measured too and lost to DFlash2 on this card, so it is not
listed. The draft length follows the drafter header block size when the file carries one.
