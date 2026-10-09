# HtmlText

`core/llm-server/chat/artifacts/HtmlText.js`

Escapes text for HTML content and double-quoted attributes in the artifact
documents.

## Methods

- `HtmlText.escape(value)`: `&`, `<`, `>` and `"` become entities; nullish is
  `''`, anything else is stringified.

## Why

Used for titles, code, media data URLs, lib URLs and markdown. Single quotes
are not escaped because every attribute the artifact documents write is
double-quoted.

`core/browser/DataFileRender` has a private escaper of its own; if a third
caller appears, this one should move to `core/shared/content`.
