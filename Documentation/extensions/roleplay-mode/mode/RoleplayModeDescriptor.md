# RoleplayModeDescriptor

`extensions/roleplay-mode/mode/RoleplayModeDescriptor.js`

The `roleplay` chat mode descriptor.

## Methods

- `RoleplayModeDescriptor.build(chat, postProcessor)` `{ id, label, description,
  requirements: ['llm'], chatUiUrl, buildTurn, postProcess }`. Images are
  optional: the setup names the image models and the reaction draws only when
  an image server is ready.
- `RoleplayModeDescriptor.buildTurn(meta, { messages, contextWindow })`
  `{ systemPrompt, postHistoryPrompt, messages?, temperature: 0.9, modelRef?,
  compact: false, samplers? }` from [NarratorContext](../prompts/NarratorContext.md)
  and [RoleplaySamplers](RoleplaySamplers.md); `messages` (the trimmed history)
  only when something was cut. `compact: false` keeps core compaction off a
  history the mode summarises itself.
