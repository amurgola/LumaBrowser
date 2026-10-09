# FileEdit

`core/shell/FileEdit.js`

Applies a set of `{ oldText, newText }` replacements to file content the way a coding agent expects.

## Methods

- `FileEdit.apply(originalContent, edits)` returns `{ ok: true, content, applied: [{ start, end, usedFuzzy }] }` or
  `{ ok: false, error }`. On failure nothing is changed and `error` is one model-facing sentence naming the failing
  edit (`edits[i]`).
- `FileEdit.countOccurrences(haystack, needle)` counts non-overlapping occurrences; an empty needle counts 0.

## Behaviour

- Every edit is matched against the ORIGINAL content, not applied one after another.
- Exact match first. If there is none, a fuzzy match on a normalized copy: smart quotes, dashes and exotic spaces
  fold to ASCII, a zero-width space is dropped, and trailing whitespace per line is ignored.
- Each `oldText` must match exactly once (exact or fuzzy), and matched ranges must not overlap.
- The file's dominant line ending (CRLF or LF) is preserved; edits may be written with either.

## Why

Models quote curly punctuation copied from docs and drop trailing spaces, so a strict match fails on text that is
plainly there. Uniqueness and no-overlap rejections exist because an ambiguous edit is worse than a refused one.

## Bug fixed in the port

The fuzzy matcher kept a map from normalized index to source index. Legacy pushed a map entry even for a zero-width space, which normalizes to nothing, so every later position was off by one: an edit near a zero-width space replaced the wrong range (it deleted the zero-width space and left a stray character behind). A folded-away character now gets no map entry.

Error messages no longer contain em-dashes; the wording is otherwise the same (nothing matched on the text).
