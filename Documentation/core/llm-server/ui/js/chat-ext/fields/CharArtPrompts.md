# CharArtPrompts

`core/llm-server/ui/js/chat-ext/fields/CharArtPrompts.js`

Prompt and model choices for the studio. `compose` joins
`[basePrefix, style, context?, subject?, extra]` with commas (context trimmed to
160 characters; derivatives drop it unless `context: true`).
`extensions/roleplay-mode` keeps a faithful copy of this order for its own
renders.

## Methods

- `new CharArtPrompts(field, siblingModel, rootModel)`: `subject()`,
  `baseModelRef()`, `editModelRef()` (empty means the default edit slot),
  `compose(extra, { context?, subject?, subjectText? })`.
- `CharArtPrompts.customEmotion(name)`, `CharArtPrompts.outfit(item)`: the edit prompts.
