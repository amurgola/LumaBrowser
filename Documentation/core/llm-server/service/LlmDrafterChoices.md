# LlmDrafterChoices

`core/llm-server/service/LlmDrafterChoices.js`

The user's speculative drafter choice per local model, keyed by model file stem (the
same key as [LlmModelDisplayNames](LlmModelDisplayNames.md)). Stored under
`core.llmServer.modelDrafters` (never rename). No entry means automatic: the
scanner's folder pairing stands.

## Shapes

- `{ mode: 'off' }`: no speculative decoding at all: no drafter file and no MTP head
  (the files stay on disk).
- `{ mode: 'mtp' }`: the MTP head built into the weights instead of a drafter file.
- `{ mode: 'file', path }`: use this drafter file from the models folder instead of
  the pairing.

## Methods

- `new LlmDrafterChoices(settingsDb)`; extends [SettingsMapStore](SettingsMapStore.md).
- `LlmDrafterChoices.normalize(choice)`: the canonical shape, or null for automatic
  and anything malformed.
- `LlmDrafterChoices.keyOf(choice)`: one string per choice (`auto`, `off`, `mtp`,
  `file:<path>`), what a launch records and the chat restart check compares.
- `all()`: every valid entry (a malformed stored entry is dropped); `get(key)`.
- `set(key, choice)`: an automatic or malformed choice removes the entry; returns
  every entry after the change. A missing key changes nothing.

Applied to every scan by [DrafterChoiceApplier](../scanner/DrafterChoiceApplier.md)
through `LlmModelsScanner.shared.useDrafterChoices`, wired in
[LLMServerService](../LLMServerService.md).

## Globals

None.
