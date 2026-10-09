# BuildName

`extensions/code-mode/tools/build/BuildName.js`

The name of the extension being built.

## Methods (static)

- `derive(meta)` -> `meta.data.name`, else `targetId`, else a slug of the
  task's first four words (lowercased, punctuation dropped, joined with `-`),
  else `'my-extension'`.
