# PathEntries

`core/shell/cli-shim/PathEntries.js`

Answers whether a raw PATH value already lists a folder.

## Methods

- `PathEntries.includes(pathValue, dir, delimiter = ';')` splits `pathValue`
  on `delimiter` and compares each entry to `dir` after trimming whitespace and
  trailing slashes, case-insensitively.

## Why

Users and installers write the same folder with different case and with or
without a trailing slash; all of those mean "already on PATH". The comparison is
case-insensitive on every platform, which matches legacy behaviour.
