# PageAnalysisScript

`core/browser/tab-manager/PageAnalysisScript.js`

In-page script for `getTabSource` type `analyze`: framework hints and selector stability.

## Methods

- `PageAnalysisScript.SOURCE` returns `{ jsRendered, frameworkHints, requiresScroll, selectorStability,
  navigationStrategy, hashedClassRatio, totalClassNames, hashedCount, idsFound, ariaLabelsFound,
  sampleSize, tableCount, listCount, pageHeight, viewportHeight }` or `{ error }`.
  Stability is `unstable` above 50% hashed class names (strategy `source`), `mixed` above 15%
  (`hybrid`), else `stable` (`template`).
