# ArtifactProvider

`core/palette/providers/ArtifactProvider.js`

Search palette provider for chat artifacts (pages, drawings, documents, code,
images, videos, audio, widgets): matches the title (weight 1), the type label and
language (0.6) and the title of the conversation it came from (0.5) over the
newest 500 version chains, one result per chain.

## Methods

- `new ArtifactProvider({ getArtifactStore })`.
- `search(query, { limit = 5 })`.
- `ArtifactProvider.item(a, score, marks)`: an `artifact` row whose id is the
  chain's root, subtitle "Code from "<conversation>"", and `data`
  `{ artifactId, conversationId, type }` (no conversation for an orphaned
  artifact, which then opens in a browser tab).
- `ArtifactProvider.typeLabel(type)`, `TYPE_LABELS`.
