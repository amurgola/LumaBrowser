# RoleplayModeDescriptor

`extensions/roleplay-mode/mode/RoleplayModeDescriptor.js`

The `roleplay` chat mode descriptor.

## Methods

- `RoleplayModeDescriptor.build(chat, postProcessor)` `{ id, label, description,
  requirements: ['llm'], chatUiUrl, buildTurn, postProcess }`. Images are
  optional: the setup names the image models and the reaction draws only when
  an image server is ready. The descriptor's `buildTurn(args)` is async: it
  narrates from `postProcessor.prepareTurn(args)` (the story state at the end of
  the path the turn continues from), falling back to the stored meta, and
  passes the cast's body notes from `grounding(meta)`.
- `RoleplayModeDescriptor.grounding(meta, bodyGrounding?)` ->
  [BodyGrounding](../grounding/BodyGrounding.md) notes for the characters on
  stage, or null (turned off with `options.bodyGrounding: false`, nothing
  applies, or a failure). Never rejects.
- `RoleplayModeDescriptor.surface(meta, messages, surfaceGrounding?)` -> the
  up-close notes for the characters the latest player line names
  ([SurfaceGrounding](../grounding/SurfaceGrounding.md)), or null (off with
  `options.surfaceGrounding: false`). Never rejects.
- `RoleplayModeDescriptor.groundingLog(grounding, surface)` -> `{ body: {
  characterId: [cardId] }, surface: { ... } }` or null, set on the turn as
  `groundingNotes` (the Lab logs it; the chat router reads only the fields it
  knows).
- `RoleplayModeDescriptor.buildTurn(meta, { messages, contextWindow, grounding, surface })`
  `{ systemPrompt, postHistoryPrompt, messages?, temperature: 0.9, modelRef?,
  compact: false, samplers? }` from [NarratorContext](../prompts/NarratorContext.md)
  and [RoleplaySamplers](RoleplaySamplers.md); `messages` (the trimmed history)
  only when something was cut or earlier replies were stripped of inline
  reasoning. `compact: false` keeps core compaction off a
  history the mode summarises itself.
