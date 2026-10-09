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

## Globals

None.
