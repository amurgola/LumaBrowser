# GameLanguageModel

`extensions/game-mode/ui/GameLanguageModel.js`

The game's language model on the chat page. The conversation's setup holds it
as `data.llmModel` (`''` or absent means the composer's current model); the
main process pins every build turn to it.

## Methods

- `GameLanguageModel.choices(api)` -> `{ options, locals }`. `options` are the
  select options: `''` "Use current chat model", every installed local model
  from `api.getLocalModelOptions()` as `Local · <name>`, then the provider
  models from `api.listModels()` (rows that are not local, not a profile and
  not the helper model). `locals` are the local rows with their file paths.
  Either source failing leaves its part out.
- `GameLanguageModel.apply(api, ref, locals)`: a local pick (`local::...`)
  points the local server at that model with `api.setDefaults({ modelPath })`,
  as the composer's picker does, so the composer follows it. A provider pick
  or no pick does nothing. Failures are swallowed: the pinned turn loads the
  model anyway.
- `GameLanguageModel.record(ref, ctx)`: a model picked in the gear's Model row
  becomes the game's model. It reads the stored meta first
  (`ctx.api.conv.meta.get`) and writes `ctx.setMeta({ data: { ...stored,
  llmModel: ref } })`: the page's copy of the meta can be older than what the
  host stored during the last turn (the game snapshot), and the write carries
  the whole data block. Nothing without a ref, a conversation or `setMeta`.

## Globals

None.
