# DocResolver

`tools/docs/DocResolver.js`

Maps root-relative paths to the docs that govern them: for each path, every non-meta doc whose patterns match,
reporting the first matching pattern of each doc as `{ doc, pattern }`. A path no doc matches maps to `[]`.

## Methods

- `static resolve(docs, paths)` -> `Map<path, { doc, pattern }[]>` (docs from `DocRepository.loadDocs`).
