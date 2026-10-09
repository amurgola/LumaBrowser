# DocGlob

`tools/docs/DocGlob.js`

The glob dialect of doc front matter, over forward-slash, project-root-relative paths: `*` matches within one
segment, `**` matches zero or more whole segments (so `core/a/**` also matches `core/a`), `?` one character.
Rejected patterns: empty, backslashes, a leading or trailing slash, `//`, three or more stars, braces, `**`
inside a segment, `.` or `..` segments.

## Methods

- `static problem(pattern)`: why a pattern is unusable, or null.
- `static compile(pattern)`: a `(path) => boolean` matcher; throws `invalid glob` for a bad pattern.
- `static normalizePath(p)`: backslashes to slashes, no leading `./`, no trailing slash.
