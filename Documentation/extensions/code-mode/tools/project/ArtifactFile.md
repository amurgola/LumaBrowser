# ArtifactFile

`extensions/code-mode/tools/project/ArtifactFile.js`

What a chat artifact becomes on disk for [SaveArtifactTool](SaveArtifactTool.md).

## Methods (static)

- `extensionOf(art)`: image/video/audio by mime (`MIME_EXT`), else png/mp4/wav;
  code by language (`CODE_LANG_EXT`), else txt; html, svg, markdown (md), live
  (html); anything else txt.
- `payloadOf(art, store)` -> `{ bytes, kind }` or `{ error }`: binary kinds decode
  base64 `content` (empty is an error); html/svg/markdown/code are UTF-8; a live
  module is `store.renderedHtml(id)` (the standalone page); other types are refused.
- `describeAll(list)` -> the "Artifacts in this conversation (newest last):"
  list (`- id · type (language) · title`), or "This conversation has no artifacts yet."
