# ArtifactPanel

`core/llm-server/ui/js/chat/panel/ArtifactPanel.js`

The artifact side panel docked right of the chat: a sandboxed iframe and the
Monaco editor, laid out per type (`data-layout` `iframe`, `monaco`, or `split`
for HTML source over its live preview). Its header is the `apHead` template
(share, download, pop out, close) whose buttons resolve handlers on the chat's
Resonant.

## Methods

- `build()`.
- `open(artifact)`: image, video and audio from the
  [MediaArtifactCache](MediaArtifactCache.md); code read-only in the editor with
  its stored language (else the title's extension); HTML as the split view (the
  served URL previews, the source becomes editable once loaded); svg and
  markdown from the served URL with a cache-busting query. Late answers for an
  artifact no longer shown are dropped.
- `stream(partial)`: code into the editor, HTML into editor and preview (read
  only while streaming), anything else into the frame (svg rendered, others as
  escaped text).
- `openWorkspaceFile(relPath)`: a tool card's "view file"; beside the Code
  surface the real editor opens it, else a read-only view of
  `api.chat.readWorkspaceFile` starting at the top.
- `close()`, `setOpen(on)` (root `cm-has-panel`, body `cm-panel-open`),
  `setLayout(layout)`, `title(title, type, building)` (also syncs the share
  button: shown while the web backend runs, enabled for a saved artifact),
  `clearBuilding()`.
