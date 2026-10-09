# ArtifactDocumentShell

`core/llm-server/chat/artifacts/ArtifactDocumentShell.js`

The standalone document chrome every authored artifact document is wrapped in.

## Methods

- `ArtifactDocumentShell.wrap(title, bodyHtml)`: a full `<!DOCTYPE html>`
  page. `title` must already be escaped; `bodyHtml` is inserted as is.
- `ArtifactDocumentShell.SCROLLBAR_CSS`: the scrollbar rules.

## Why

The LumaBrowser dark palette, system fonts, and styling for tables, code,
quotes and media, so a fragment still looks intentional.

Artifact documents load inside the chat's side-panel iframe, which does not
inherit the LLM tab's scrollbar rules, so each document carries the app's
subdued 15%-opacity accent scrollbar itself. Keep it in sync with
`PANEL_SCROLLBAR_CSS` in `core/llm-server/ui/js/chat-mode.js`. A model's own
full html document is not wrapped (the panel injects the style at load time).
