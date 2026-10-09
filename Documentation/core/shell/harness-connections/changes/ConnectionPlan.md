# ConnectionPlan

`core/shell/harness-connections/changes/ConnectionPlan.js`

What a connector wants in a harness's config files, built by `HarnessConnector.plan()`.

## Methods

- `file(file, format)` -> `{ set(path, value), seed(path, value) }`, both chainable.
  `set` always writes; `seed` writes only when the key is missing and never
  overwrites the user's value (file versions, timestamps).
- `settings()` -> `[{ file, format, path, value, seedOnly }]` in order; `files()` unique files.

## Why

Connectors declare data, not edits, so one engine
([ChangeApplier](ChangeApplier.md), [ChangeReverter](ChangeReverter.md)) writes,
records, previews and undoes every harness the same way.
