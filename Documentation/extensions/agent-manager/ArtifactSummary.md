# ArtifactSummary

`extensions/agent-manager/ArtifactSummary.js`

The wire-safe artifact shape for API clients.

## Methods (static)

- `of(a)` -> `{ id, title ('Artifact'), type ('artifact'), version (1), url (null) }`,
  never the content; null without an id.
- `list(artifacts)` maps `of` over a possibly missing list.
