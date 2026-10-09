# SemanticTreeScript

`core/browser/extraction/SemanticTreeScript.js`

In-page extraction script: a flat list of visible actionable elements, one line
each, grouped into page zones. For page summaries and selector resolution,
where tree shape is not needed and every wrapper div costs local-LLM prefill.

## Methods

- `SemanticTreeScript.SOURCE`: a self-invoking script for `executeJavaScript`
  (via `TabManager.getTabSource(tabId, { type: 'semanticTree' })`). Returns
  `{ zones: { navTop, navBottom, footer, sidebar, main, forms[] }, refMap, stats }`,
  each zone `{ selector, lines, count }`, or `{ error, stack }` on failure.

## Output

Line format: `@refN | <selector> | "<visible text>"`. The selector matches the
element on this DOM and is built from the element's own attributes only: a
stable id, else tag + up to two non-hashed classes + a discriminating attribute
(`href` up to 120 chars, `name`, `placeholder`, `type`, `aria-label`, `role`).
Text is capped at 80 characters; quotes are escaped. `refMap` maps each ref to
its selector; `stats` has `actionableCount`, `originalBytes`, `slimBytes`,
`compressionRatio`.

Invariants: hidden elements (`hidden`, `aria-hidden="true"`, no layout box) are
skipped without `getComputedStyle` (a style recalc per element costs seconds on
big pages); an element appears in at most one page zone; forms are always
listed on their own. Zones are picked by actionable-content size, so a hidden
mobile drawer never beats the visible nav. Only this extractor reports `navBottom`.
