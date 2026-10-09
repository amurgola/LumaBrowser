# ContentRootLocator

`core/shared/content/ContentRootLocator.js`

Chooses the subtree that holds the page's main content.

## Methods

- `ContentRootLocator.locate(document)` returns the first `<main>` or
  `role="main"` element, else a lone `<article>`, else `<body>` (or the
  document when there is no body). A candidate must hold at least
  `MIN_TEXT_SHARE` (20%) of the body's text.

## Why

An author who declares `<main>` is saying where the content is, which beats
any heuristic. The share check guards against a `<main>` that wraps only a
banner. Several `<article>`s mean a listing page, where the whole body is the
content.
