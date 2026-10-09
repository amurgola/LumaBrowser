# RoleplayModeDescriptor

`extensions/roleplay-mode/mode/RoleplayModeDescriptor.js`

The `roleplay` chat mode descriptor.

## Methods

- `RoleplayModeDescriptor.build(chat, postProcessor)` `{ id, label, description,
  requirements: ['llm', 'image'], chatUiUrl, buildTurn, postProcess }`.
- `RoleplayModeDescriptor.buildTurn(meta)` `{ systemPrompt, temperature: 0.9, modelRef? }`.
