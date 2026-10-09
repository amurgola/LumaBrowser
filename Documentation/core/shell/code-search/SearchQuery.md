# SearchQuery

`core/shell/code-search/SearchQuery.js`

Reads a code search's options the same way for every backend.

## Methods

- `SearchQuery.pattern({ pattern, ignoreCase })` compiles the regex; throws `A search pattern is required` when the
  pattern is missing or not a string.
- `SearchQuery.fileFilter({ glob })` is [GlobPattern](../GlobPattern.md)`.toRegExp(glob)`, or null without a glob.
- `SearchQuery.grepLimit({ maxMatches })` (default 100) and `SearchQuery.findLimit({ maxResults })` (default 500):
  any value that is not a finite positive number falls back to the default.
- `SearchQuery.allowDirs({ glob })` and `SearchQuery.skippedDirs({ glob })` delegate to
  [SearchSkipDirs](../SearchSkipDirs.md) `explicitDirAllowances` and `effectiveFor`.
