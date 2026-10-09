# LiveModuleEdit

`core/llm-server/chat/bridge/tools/artifacts/LiveModuleEdit.js`

Applies an edit_artifact request to a LIVE module's `{ html, js, libs }`.

## Methods (all static)

- `apply(src, params)`: `{ ok: true, html, js, libs }` or `{ ok: false, error }`.
  With `replacements`, each applies to whichever field it uniquely matches
  (exact, then whitespace-tolerant), refusing a find in both fields, several
  matches without `replaceAll`, or none (with
  [ArtifactRetryContent](ArtifactRetryContent.md)`.forLiveModule`). Otherwise
  `html` / `js` / `libs` replace those fields; with none, `NO_EDIT`. An empty
  result is refused with `EMPTY`.
- `NO_EDIT`, `EMPTY`.

## Why

A flat text blob is something the live renderer cannot parse and shows blank.
