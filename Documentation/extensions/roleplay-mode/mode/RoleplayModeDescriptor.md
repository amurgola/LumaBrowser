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
  (also `stateInHead`: the registered `buildTurn` sets it unless the core passed
  `capabilities.turnPrompt`, so an app older than the add-on, which would drop
  the turn prompt, keeps the story state in the system prompt)
  `{ systemPrompt, turnPrompt?, postHistoryPrompt, messages?, temperature: 0.9, modelRef?,
  compact: false, samplers? }` from [NarratorContext](../prompts/NarratorContext.md)
  and [RoleplaySamplers](RoleplaySamplers.md); `messages` (the trimmed history)
  only when something was cut or earlier replies were stripped of inline
  reasoning. `compact: false` keeps core compaction off a
  history the mode summarises itself.

## Changes (2026-11-09)

- The descriptor says `choices: false`: the router never folds the
  "Suggest replies" document into a roleplay turn (every live reply used to
  end on a ```choices fence that went back into the history and into the
  stage call's passage, which the Lab never saw).
- `rememberGrounding(conversationId, notes)` / `lastGrounding(conversationId)`:
  each prepared turn records the cards it handed the narrator (the
  `groundingLog` shape, or null), bounded to `GROUNDING_MEMORY` conversations,
  newest kept. The router drops the turn's `groundingNotes` field, so the
  Roleplay Lab reads it here after each turn.

## Turn log and ceiling (2026-11-12)

`_prepared` times the two knowledge-base lookups and hands them to
`journalGrounding`, which records a `grounding` event in the verbose turn log
(per lookup: on or off, whether a knowledge base answered, how long it took,
what each character on stage was looked up by and which cards came back). It
also remembers the turn's word ceiling in `ReplyLength`.

The turn carries the story's "Narrator thinking" setting (`NarratorThinking`):
a thinking budget with the samplers for Brief, `reasoningEffort: 'off'` for Off.
