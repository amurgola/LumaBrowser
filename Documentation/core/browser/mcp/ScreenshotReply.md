# ScreenshotReply

`core/browser/mcp/ScreenshotReply.js`

Builds the `browser_screenshot` MCP reply.

## Methods

- `ScreenshotReply.build(data, fullPage)` returns `{ content: [image, text?] }`, or `null` when `data`
  has no `screenshot`. The image part uses `data.mimeType` (default `image/png`).
- `ScreenshotReply.note(data, fullPage)`: for a viewport shot with a `frame`, the pixel geometry (either
  "= the CSS viewport; ... passed directly to browser_click_at" or "at <scale>x the <w>x<h> CSS viewport;
  divide pixel coordinates by <scale>"); then `data.marks.text` (the ref list matching the drawn numbers).
  Lines joined with a newline; empty when there is nothing to say.
