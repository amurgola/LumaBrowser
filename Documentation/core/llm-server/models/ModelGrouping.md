# ModelGrouping

`core/llm-server/models/ModelGrouping.js`

The one place a local LLM file is placed in the model tree every list renders: the Setup installed models
([LlmModelRow](../ui/js/setup-ui/models/LlmModelRow.md)), the Defaults dropdown
([DefaultsOptions](../ui/js/setup-ui/defaults/DefaultsOptions.md)) and the chat model picker
([LocalModelRows](../ui/js/chat/composer/LocalModelRows.md)). The main process attaches the result as `grouping` on
both feeds ([LlmModelsView](../ipc/LlmModelsView.md) `decorate` and [LocalModelOptions](../ipc/LocalModelOptions.md)),
and the renderer's [ModelTree](../ui/js/models/ModelTree.md) builds and orders the tree from it, so the lists stay in
parity.

## Methods

All static.

- `of(model, { customName })` returns `{ family, line, sizeB, variant, quant, quantBits, label }`:
  - `family` ("Qwen 3.8", "Gemma 4", "GPT OSS"), or `null` when neither the file name nor the GGUF header
    (`baseName`, then `name`) names one;
  - `line` the size ("27B", "35B A3B"; from the header's `parameterCount` when the name has none), or the
    size-less model's own words ("Flash Next");
  - `sizeB` the size in billions for ordering, `null` without one;
  - `variant` the words that tell the file from its siblings ("Absolute Heresy"), empty for a plain release, the
    user's rename whole when there is one;
  - `quant` the file name's quant (`UD-Q6_K_M`, `IQ2_S`, `MXFP4`), else the header's file type;
  - `quantBits` an approximate bits per weight, only for ordering largest quant first;
  - `label` the unique one-line name ("Qwen 3.8 27B · UD-Q6_K_M", or "rename · quant").
- `attach(models, overrides)` sets `grouping` on every model, with renames from the display-name override map
  (keyed by file stem, `stemKey(m)`).
- `stemOf(model)`, `quantOfStem(stem)`, `quantBits(quant)`, `sizeBillions(size)`, `sizeFromCount(count)`,
  `tokens(text)`, `parseFamily(tokens)`.

## Parsing rules

- An `Author_` prefix goes; names split on dashes, spaces and dots between words. A glued version splits off its
  brand (`Qwen3.8` is Qwen, 3.8), and a glued two digit version is a dotted one without the dot (`qwen38` is 3.8).
  Quants and formats (`MXFP4`) are never split.
- The family runs up to and including the first version token (a token with a digit that is not a size), plus a
  line tag right after it (`VL`, `Omni`, `Coder`). With no version, the words before a size are the family.
- Noise never names a family or variant: `instruct`, `it`, `gguf`, imatrix tags (`i1`), Unsloth's `UD` (the quant
  carries it as `UD-`).

## Why

The display name ([ModelName](ModelName.md)) strips the quant, so one model in three quants listed as three
identical rows. Each list used to name and order models on its own; one placement function on the main side plus
one tree builder in the renderer keeps every list grouped and sorted the same way.

## Globals

None.
