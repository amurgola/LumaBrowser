# AssistantBlock

`ide/webview/ui/AssistantBlock.js`

The answer as rendered markdown, re-rendered at most once per animation frame.

## Methods

- `new AssistantBlock(transcript, host)`; `text` (get/set: setting queues a paint); `seal()` removes an empty
  block or paints the final text; `node`. Before `seal()` the text renders with
  `{ streaming: true }` (open markdown closed, see StreamingMarkdown.md); a frame still queued after it repaints
  the final text, not a live render.

## Safety

Rendering is `MarkdownRenderer.render`, which escapes before any rule (see MarkdownRenderer.md).
