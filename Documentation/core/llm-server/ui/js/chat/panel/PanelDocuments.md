# PanelDocuments

`core/llm-server/ui/js/chat/panel/PanelDocuments.js`

The documents the panel writes into its sandboxed iframe: building (escaped
partial source or "Generating <type>…"), svg, image, video (an image fallback
when ffmpeg was missing) and audio, each with a literal background (CSS
variables do not cross into the frame) and the app's scrollbar style.

## Methods

- `PanelDocuments.APP_BG`, `SCROLLBAR_CSS`, `SCROLLBAR_STYLE`.
- `building(type, partial)`, `svg(markup)`, `image(b64, mime, loading, errorText?)`,
  `video(...)`, `audio(...)`.
- `installScrollbar(frame)`: on every load, prepends the style once to the
  frame's document (so a served, model-authored page gets it too and its own
  rules still win); cross-origin frames are skipped.

`SCROLLBAR_CSS` must match
[ArtifactDocumentShell](../../../../chat/artifacts/ArtifactDocumentShell.md)`.SCROLLBAR_CSS`;
a parity test holds them.
