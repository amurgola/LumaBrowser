# MediaArtifactCache

`core/llm-server/ui/js/chat/panel/MediaArtifactCache.js`

Session cache of binary artifact bytes (images, video, audio) by id, with
in-flight dedupe, so the thumbnail, the panel and every re-render share one
`api.artifact.get`. The artifact's `language` column holds its mime.

## Methods

- `peek(id)`: the cached `{ b64, mime, dataUrl }` or undefined.
- `load(id)`: resolves the entry or `null`.
