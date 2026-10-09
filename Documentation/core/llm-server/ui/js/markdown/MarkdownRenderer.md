# MarkdownRenderer

`core/llm-server/ui/js/markdown/MarkdownRenderer.js`

The chat's bespoke markdown renderer, used by the chat, the web client, the
Dashboard, On Demand and the share viewer.

## Methods

- `MarkdownRenderer.render(md, opts?)` returns HTML; `''` for empty or nullish
  input. `opts.streaming`: `md` is a reply still arriving, so constructs it
  left open (a code fence, `**bold**`, a link) are closed first by
  [StreamingMarkdown](StreamingMarkdown.md). The chat's live answer, running
  sub-agent cards, On Demand and the IDE webview pass it while streaming.
- Constants: `FENCE_RE`, `TABLE_RE`.

## Pipeline

1. Fenced code (```` ```lang ... ``` ````) is highlighted with
   [CodeHighlighter](CodeHighlighter.md) and parked as `@@FENCE<n>@@`
   placeholders, so no later rule can touch it.
2. Everything else is escaped with `HtmlEscaper.escapeKeepingApostrophes`
   (`& < > "`). From here on, raw HTML in a message is inert text.
3. GFM tables become `<table>` (cells get the inline rules in the next step).
4. [MarkdownBlocks](MarkdownBlocks.md) walks the lines into headings, rules,
   lists and paragraphs, applying [MarkdownInline](MarkdownInline.md).
5. Fences are restored; a fence alone in a paragraph is unwrapped so `<pre>`
   never nests in `<p>`.

Widget fences: a ```` ```chart ```` or ```` ```stats ```` fence whose body is a valid
spec is parked as the [ChartWidget](ChartWidget.md) or
[StatsWidget](StatsWidget.md) HTML instead of code (built from escaped values),
and the line breaks joining it to the text around it are dropped. While
streaming (`opts.streaming`), a widget fence whose JSON is still arriving shows
a "Drawing a chart…" or "Gathering numbers…" placeholder rather than raw JSON;
a final one that does not parse stays a code block.

## Safety

Escaping happens before any rule, so `<script>`, event-handler attributes and
`<img onerror>` stay text. Links accept only `http(s):` URLs and images only
`https:` (with `referrerpolicy="no-referrer"` and lazy loading); a quote in a
URL or alt text is already `&quot;` and cannot open an attribute. The tests
render a legacy-captured corpus (`helpers/LegacyMarkdownGolden.js`, outputs of
the legacy renderer) byte for byte, and parse XSS-style inputs in jsdom to
prove no script, `on*` attribute or non-http(s) `href`/`src` comes out.

Kept legacy quirks (characterised in the golden corpus): the blockquote branch
never fires because `>` is escaped first, and literal `@@FENCE<n>@@` text in a
message is replaced by that fence's (already escaped) code.

## Globals

None.
