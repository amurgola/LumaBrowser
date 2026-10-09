# StructuralSummaryScript

`core/browser/extraction/StructuralSummaryScript.js`

In-page extraction script: a compacted HTML skeleton of the live page that
keeps its tree shape, for repeating-item detection.

## Methods

- `StructuralSummaryScript.SOURCE`: a self-invoking script for `executeJavaScript`
  (via `TabManager.getTabSource(tabId, { type: 'structural' })`). Returns
  `{ html, zones: { navTop, main, footer, sidebar, forms[] }, repeats, stats }`,
  each zone `{ selector, html }`, or `{ error, stack }` on failure.

## Output

- Sibling groups sharing a structural signature (tag + clean classes + child
  shapes, 2 levels) of 3 or more keep 3 exemplars (first, middle, last) plus one
  `<luma-omitted count="N"/>`; each group is listed in `repeats` with its path and count.
- Text over 120 characters becomes `[TEXT len=N words=W sample="..."]`.
- `script`, `style`, `svg`, `iframe` and similar are removed; only whitelisted
  attributes survive (ids, names, roles, aria, test ids, href, ...); hashed
  classes are dropped; `data:` URLs are skipped.
- Over a 20 KB budget it tightens in up to three passes (fewer exemplars,
  shorter text, lower repeat threshold, shallower signatures);
  `stats.compactAttempts` says how many.
- Zones: header/nav, footer, main (landmarks, else the largest body child),
  sidebar, real forms, then synthesized forms for standalone controls grouped
  under their nearest meaningful container.

No `navBottom`: detecting a secondary nav would have to join the exclude set,
which changes what falls out as `main`. [SemanticTreeScript](SemanticTreeScript.md)
reports it.
