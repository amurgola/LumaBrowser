# LiteMarkdown

`extensions/ai-chat/ui/lite-panel/LiteMarkdown.js`

The side panel's minimal escape-first markdown.

## Methods

- `LiteMarkdown.render(text)`: `''` for empty; fenced blocks become
  `<pre><code>` of the escaped body; other text is escaped with
  [HtmlEscaper](../../../../core/llm-server/ui/js/format/HtmlEscaper.md)`.escape`
  (five entities), then `` `code` `` -> `<code>`, `**bold**` ->
  `<strong>`, newlines -> `<br>`.
