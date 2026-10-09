# BoundedParallel

`core/llm-server/scanner/BoundedParallel.js`

Maps over a list with a cap on in-flight async calls.

## Methods

- `BoundedParallel.map(items, limit, fn)` resolves `fn(item, index)` results in
  input order, with at most `limit` calls running at once.

## Why

Header reads are small, but a big model library must not open dozens of file
handles in one burst. Generic: a reuse candidate for `core/shared` if a second
subsystem needs it.
