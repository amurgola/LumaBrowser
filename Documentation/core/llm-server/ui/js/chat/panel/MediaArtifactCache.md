# MediaArtifactCache

`core/llm-server/ui/js/chat/panel/MediaArtifactCache.js`

Session cache of binary artifact bytes (images, video, audio) by id, with
in-flight dedupe, so the thumbnail, the panel and every re-render share one
`api.artifact.get`. The artifact's `language` column holds its mime.

Each entry carries `url`, a blob URL decoded once for `<img>` / `<video>`
sources (no multi-megabyte data URL per element, and a video seeks properly
from it); `dataUrl` is built on first read for callers that need the inline
form (the region editor) and stands in for `url` where blob URLs are missing.

## Methods

- `peek(id)`: the cached `{ b64, mime, url, dataUrl }` or undefined.
- `load(id)`: resolves the entry or `null`.
- `MediaArtifactCache.entry(b64, mime)`: builds one.
