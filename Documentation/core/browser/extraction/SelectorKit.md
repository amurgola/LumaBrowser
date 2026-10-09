# SelectorKit

`core/browser/extraction/SelectorKit.js`

Detects machine-generated (hashed) class names and ids, in Node and as in-page
source, so selectors built for the model survive the next site deploy.

## Methods

- `SelectorKit.isHashedToken(token)` returns true when a class name or id
  matches one of the hashed patterns; false for empty or non-string input.
- `SelectorKit.HASHED_TOKEN_PATTERNS` is the pattern list (`css-1a2b3c`,
  `_abc12`, `sc-Kgfbxs`, `svelte-x`, `jsx-123`, `emotion-x`, 8+ hex chars,
  `ab-x1y2z3`).
- `SelectorKit.HASHED_TOKEN_SRC` is page source declaring `HASHED_TOKEN_PATTERNS`
  and `function isHashedToken(token)` in the enclosing scope. Splice it inside
  the IIFE of any extraction script.

## Why

Build-tool ids and classes are regenerated on every deploy, so a selector built
on one matches today and nothing tomorrow. The legacy selector builders offered
such ids to the LLM as the "most stable" selector and the model stored them
(BUG_BACKLOG M30). Page scripts run through
`webContents.executeJavaScript` and cannot `require`, so the source predicate is
generated from the same pattern list and the two can never drift.
