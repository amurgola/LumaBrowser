# ArtifactRetryContent

`core/llm-server/chat/bridge/tools/artifacts/ArtifactRetryContent.js`

The ground truth handed back when an artifact edit's `find` missed.

## Methods (all static)

- `forArtifact(src)`: `CURRENT content of "<title>" (<type>); copy an exact
  "find" from this:` and the content in `<<<ARTIFACT ... ARTIFACT>>>`, or its
  first `MAX_ARTIFACT_CHARS` (6000) with a `…(truncated)` marker.
- `forLiveModule(title, html, js)`: the html and js as two labelled blocks,
  each clipped to `MAX_LIVE_FIELD_CHARS` (4000) with a
  `[clipped: showing N of M characters]` line.

## Why

The model edits blind (the catalog carries ids and titles only); without the
content its only recovery was a full rewrite from memory that discarded the
real design.
