# ArtifactTextEdit

`core/llm-server/chat/bridge/tools/artifacts/ArtifactTextEdit.js`

Applies edit_artifact's `replacements` to a plain (non-live) artifact.

## Methods (all static)

- `apply(src, replacements)`: `{ ok: true, content, fuzzyUsed }` or
  `{ ok: false, error }`. Per replacement: validated, then an exact match (one
  match, or every match with `replaceAll`; several without it is refused), then
  [FuzzyReplacement](FuzzyReplacement.md); an ambiguous or missing `find` is
  refused with [ArtifactRetryContent](ArtifactRetryContent.md)`.forArtifact`.
- `fuzzyNote(fuzzyUsed)`: the " Note: N edit(s) matched after normalizing
  whitespace ..." suffix, or `''`.
- `invalidReplacement(r, i)`: the `"find"` / `"replace"` required errors, or null.
- `AMBIGUOUS_HINT`.
