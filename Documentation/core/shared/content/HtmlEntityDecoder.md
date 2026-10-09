# HtmlEntityDecoder

`core/shared/content/HtmlEntityDecoder.js`

Decodes HTML character references in a text run.

## Methods

- `HtmlEntityDecoder.decode(text)` replaces common named references
  (`NAMED_ENTITIES`: `amp`, `lt`, `gt`, `quot`, `apos`, `nbsp` (to a plain
  space), typographic quotes and dashes, currency, fractions, and similar),
  decimal `&#65;` and hex `&#x41;` / `&#X41;` references. Unknown names, zero,
  and out-of-range code points are left exactly as written. Input is coerced
  with `String()`.

## Why

Used by `HtmlTokenizer` (text and attribute values) and directly by the web search result parsers in
`core/llm-server/chat/webTools.js` (DuckDuckGo and Bing title/href decoding),
so both read entity-encoded text the same way. The named table is a small
practical subset, not the full HTML5 list, because pages overwhelmingly use
these.
