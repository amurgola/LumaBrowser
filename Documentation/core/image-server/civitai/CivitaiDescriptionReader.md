# CivitaiDescriptionReader

`core/image-server/civitai/CivitaiDescriptionReader.js`

Asks the local model to read a CivitAI checkpoint's description (the creator's own recommendations) and answer the settings as one JSON object, then validates and translates every value before anyone trusts it.

## Methods

- `new CivitaiDescriptionReader({ llm, slotId?, timeoutMs?, convert? })`; `llm` is the [LLMService](../../llm-service/LLMService.md) (null makes the reader unavailable), `slotId` defaults to `image-server.civitai-reader` (registered on construction with `extensionId: 'core'`, `required: false`, so the user's default provider answers unless the slot is bound elsewhere), `timeoutMs` to 120 s, `convert` to [HtmlToMarkdown](../../shared/content/HtmlToMarkdown.md)`.convert`.
- `available` true when `llm.sendCompletion` exists.
- `read({ model, version, map })` resolves `{ recipe, raw, text }` or `null` (no model, fewer than 40 characters of text, a failed or thrown completion, a reply without a JSON object, or an object with nothing usable). The prompt names the checkpoint, the version and the base so a description covering several variants answers for the right one; the completion runs at temperature 0 with the label `CivitAI model notes`.
- `text(model, version)` the version description then the model description as Markdown, capped at 9000 characters with a `[truncated]` marker.
- `parseJson(raw)` the first `{...}` in the reply, code fences tolerated, with a fallback to the first closing brace when the widest slice does not parse.
- `validate(obj)` keeps `steps` (1..150), `cfgScale` (0..30, one decimal), `sampler` and `scheduler` (sd.cpp names through [CivitaiSamplerMap](CivitaiSamplerMap.md), with `samplerSource` and `samplerExact`), `width` and `height` (256..4096, both or neither), `clipSkip` (1..12), `negativePrompt` (2000 chars), `positivePrefix` (400), `triggerWords` (20 strings of 80), `notes` (300), `confidence` (0..1); `null`, `none` and `n/a` strings are dropped; null when nothing but confidence survives.

## Why

Creators write the real recipe in prose ("Hyper: DPM SDE++ Karras, 4 to 6 steps, CFG 1.5 to 2.0") that no field in the API carries, and a small local model reads it reliably when told to answer null rather than guess. The reader is a best-effort side of [CivitaiRecipe](CivitaiRecipe.md): every failure path resolves null so an import never waits on or fails for the model.
