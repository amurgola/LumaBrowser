# PageSource

`core/browser/tab-manager/PageSource.js`

Reads a tab's page source in one extraction type.

## Methods

- `PageSource.read(page, { type })` -> `{ success: true, source, extractionType }`; `type` defaults to `clean`. For `markdown` the HTML string is converted with [HtmlToMarkdown](../../shared/content/HtmlToMarkdown.md), with the tab URL (`page.url()`) as the base for relative links.
