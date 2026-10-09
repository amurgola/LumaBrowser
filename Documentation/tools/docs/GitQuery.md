# GitQuery

`tools/docs/GitQuery.js`

Runs a read-only git command in a folder (stderr ignored) for the docs tools. `run` answers stdout, or null when
git fails or is not installed; `lines` answers trimmed non-empty stdout lines (`[]` on failure).

## Methods

- `static run(root, args)`, `static lines(root, args)`.
