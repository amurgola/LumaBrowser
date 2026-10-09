# GlobPattern

`core/shell/GlobPattern.js`

Translates a path glob into regular expression source over slash-separated paths. Shared by
[CodeSearch](CodeSearch.md) and [GitignoreFilter](GitignoreFilter.md) so both read globs the same way.

## Methods

- `GlobPattern.toSource(glob, { braces = false })`: `*` is `[^/]*`, `?` is `[^/]`, `**/` is `(?:.*/)?` (zero or
  more whole directories), any other `**` is `.*`, and every other character is literal. With `braces`, `{a,b}` is
  alternation and each option is itself a glob; an unclosed `{` stays literal. Without it (the `.gitignore` form,
  which has no alternation) braces are literal.
- `GlobPattern.toRegExp(glob)` is `(^|/)<source>$` with braces on: unanchored at the front so `*.js` matches nested
  paths, anchored at the end.
- `GlobPattern.escape(text)` escapes regex metacharacters.

Character ranges like `[a-z]` are literal text in both forms.
