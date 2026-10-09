# ArtifactContent

`core/llm-server/chat/artifacts/ArtifactContent.js`

The artifact kinds and how each one's content is stored.

## Methods

- `ArtifactContent.TYPES`: `html`, `svg`, `markdown`, `code`, `image`,
  `video`, `audio`, `live`.
- `ArtifactContent.typeOf(type)`: the kind, or `html` for anything unknown.
- `ArtifactContent.isMedia(type)`: image, video or audio.
- `ArtifactContent.normalize(type, { content, bytes, mime, language })` returns
  `{ storedContent, storedLanguage }`:
  - text kinds: `content` as a string (`''` when nullish), `language` or `null`;
  - media: base64 of `bytes` (a Buffer), else `content` if it is a string, else
    `''`; the mime from `mime`, else `language`, else `image/png`,
    `video/mp4` or `audio/wav`.

## Why

Media reuses the existing `language` column for the mime type rather than a
schema change. A `live` artifact's content is JSON `{ html, js, libs[] }`; it
renders inline in the chat and as a standalone page for pop-out and sharing.
A `video` may hold a first-frame image instead of an mp4 (its mime says so).
