# SearchText

`extensions/code-mode/tools/project/SearchText.js`

Wording shared by the search tools.

## Methods (static)

- `skippedNote(res)` -> `' (Search never descends into <dirs>; to look inside one, name it in the glob, e.g. "build/**".)'`
  when `res.skippedDirs` is non-empty, else `''`. A bare "no match" from a
  search that skipped `build/` read as "it does not exist".
- `boundedBody(truncator, lines, limitReached, limitNote)` -> the head-truncated
  body, the truncator's notice, and `[<limitNote>]` when the search hit its limit.
- `plural(n, one, many)`.
