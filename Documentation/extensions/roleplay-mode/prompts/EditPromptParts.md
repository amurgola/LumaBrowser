# EditPromptParts

`extensions/roleplay-mode/prompts/EditPromptParts.js`

Shared clauses for edit-model prompts, all in the positive voice because the
edit model runs at CFG~1, where a named failure mode is summoned.

## Methods

- `CHROMA_BG`, `CHROMA_REMINDER`, `PROPORTIONS`, `CAMERA`.
- `styleAnchor(data)`, `preserveIdentity(char)`, `eyeNote(char)` (`' (green eyes)'` or `''`),
  `accessoryClause(char, state?)`.
