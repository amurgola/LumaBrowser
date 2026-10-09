# SelectorQuerySanitizer

`core/shared/content/SelectorQuerySanitizer.js`

Parameterizes `href`/`src`/`action` attribute-equals selectors that embed a full
query string.

## Methods

- `SelectorQuerySanitizer.sanitize(selector)` rewrites every
  `[href|src|action="path?query"]` into `[attr^="path?"]` plus one
  `[attr*="param"]` per pagination param (`page`, `p`, `pg`, `offset`, `start`,
  case-insensitive). Selectors without a query, other attributes, and
  non-string input are returned unchanged.

## Why

Selectors learned or authored against a live page bake that session's query
into pagination selectors (`[href="/Search?id=Red Rising&page=2"]`). That only
matches that exact query and leaks one session's activity into every later
session's context. The rewrite gives `[href^="/Search?"][href*="page=2"]`.

It is shared so that every path that stores or serves a learned selector
applies the same rewrite.
