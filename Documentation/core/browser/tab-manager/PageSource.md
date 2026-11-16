# PageSource

`core/browser/tab-manager/PageSource.js`

Reads a tab's page source in one extraction type, whole or narrowed to the elements a selector matches.

## Methods

- `PageSource.read(page, { type, selector })` -> `{ success: true, source, extractionType }`; `type` defaults to `clean`. For `markdown` the HTML string is converted with [HtmlToMarkdown](../../shared/content/HtmlToMarkdown.md), with the tab URL (`page.url()`) as the base for relative links.
- With `selector` the read covers only its matches ([PageSourceScripts](PageSourceScripts.md)) and the reply adds `selector` and `matched` (the number of elements). It fails, without reading, when the type cannot be narrowed (`selector is not supported for type "<type>"`), the page cannot parse the selector or does not answer (`Invalid selector "<selector>": <reason>`), or nothing matches (`No elements found for selector "<selector>"`).

## Why

A selector that matches nothing is an error, so an empty read is never mistaken for an empty page.
