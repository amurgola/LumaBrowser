# ResponseText

`core/llm-server/chat/web-tools/ResponseText.js`

Turns a SafeFetch response body into model-readable text. Used by
[PageReader](PageReader.md) and [LivePageFetch](../live-api/LivePageFetch.md).

## Methods (static)

- `isHtml(res)`: HTML or XML by content type; JSON, `text/plain` and CSV never;
  an untyped body is sniffed (first `SNIFF_CHARS`, 2,000) for `<html` or
  `<!doctype html`.
- `toText(res)`: HTML goes through `HtmlToMarkdown.convert` with
  `baseUrl: res.finalUrl`; anything else keeps its text with CRLF normalised
  and 3+ newlines collapsed.

## Why

APIs and plain text pass through untouched (a JSON endpoint wants its JSON).
The final URL (after redirects) is the base the converter resolves relative
links against, so they stay in the Markdown, where the model can follow them
and [BoilerplateTrimmer](BoilerplateTrimmer.md) can see menus.
