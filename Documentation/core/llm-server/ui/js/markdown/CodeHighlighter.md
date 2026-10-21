# CodeHighlighter

`core/llm-server/ui/js/markdown/CodeHighlighter.js`

The chat's compact, language-agnostic code highlighter.

## Methods

- `CodeHighlighter.highlight(code)` escapes the code with
  `HtmlEscaper.escapeKeepingApostrophes`, then wraps tokens in
  `<span class="cm-tk-...">`: `com` (`//`, `#`, `/* */`), `str` (`"`, `'`, `` ` ``
  strings), `num`, `kw` (a cross-language keyword list) and `fn` (a name before
  `(`). At each position the first rule in `RULES` that matches exactly there
  wins; unmatched characters pass through. Output never contains raw input.
- `CodeHighlighter.RULES` is the ordered `[regex, class]` table (global regexes,
  positioned with `lastIndex`).
- Results are remembered per code string (`CACHE_MAX` 64 entries, nothing over
  `CACHE_MAX_CHARS` 200 000 characters; the oldest entry goes first), so the
  finished fences of a streaming answer are highlighted once rather than on
  every repaint; `CodeHighlighter.isCached(code)` for tests.

## Why the cache

The live answer is re-rendered from its whole text many times a second, and the
highlighter walks each fence character by character trying six regexes at every
position. The fences before the cursor never change while the answer streams, so
the only fence that needs work is the open one. Zed cut its draw p99 in half the
same way (content-keyed highlight cache, PR #63138).

## Globals

None.
