# ArtifactDocument

`core/llm-server/chat/artifacts/ArtifactDocument.js`

Wraps an artifact's stored content into a self-contained, styled HTML document
for [ArtifactStore](../ArtifactStore.md) (the `<id>.html` file and
`renderedHtml`).

## Methods

- `ArtifactDocument.render(row, opts = {}, configuredBase = null)`. `row` is
  `{ id, root_id, title, type, language, content }`; `opts` are the live-module
  surface options; `configuredBase` is the gateway web base or `null`.

## Per kind

| kind | body |
|---|---|
| `html` | a full document (`<!doctype html` or `<html`) is returned verbatim; a fragment goes in a `.cm-art-body` |
| `svg` | centred |
| `image` | `<img>` with a `data:` URL (mime defaults to image/png) |
| `video` | `<video controls autoplay loop muted playsinline>`, or `<img>` when the mime is `image/*` (a first-frame fallback) |
| `audio` | `<audio controls>`, never autoplay (songs are minutes long) |
| `markdown` | [ArtifactMarkdown](ArtifactMarkdown.md) in an `<article>` |
| `live` | [LiveModuleDocument](LiveModuleDocument.md) |
| `code` | an escaped `<pre>` under a `title · language` header (`text` without a language) |

Everything except a full html document is wrapped in
[ArtifactDocumentShell](ArtifactDocumentShell.md). Media is embedded as data
URLs so a saved file still works after the side panel is closed.
