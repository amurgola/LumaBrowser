# DiffCardPresenter

`core/llm-server/chat/presentation/DiffCardPresenter.js`

The diff card for the mutating file tools (`edit_file`, `write_file`,
`write_extension_file`). Extends [ToolCardPresenter](ToolCardPresenter.md).

## Methods

- `DiffCardPresenter.attachBasis(result, before, after)` stores
  `{ before, after }` on `result[BASIS]` (`before` is `null` unless it is a
  string). Nothing is attached when either side is longer than
  `BASIS_MAX_CHARS` (256 KB) or `result` is not an object.
- `DiffCardPresenter.present(args, result)` returns
  `{ kind: 'diff', path, created, added, removed, truncated, hunks }` where each
  hunk is `{ oldStart, newStart, lines: [{ op, text }] }` and every line is
  clipped to `HUNK_LINE_MAX_CHARS` (400) plus an ellipsis. `created` is true when
  `before` was `null`.
  - No basis: `{ kind: 'diff', path, created: false, noBasis: true }`, or `null`
    without a path.
  - Basis too long for [LineDiff](../../../shared/text/LineDiff.md):
    the same `noBasis` card.
- `DiffCardPresenter.validate(meta)`: needs a non-empty path. A `noBasis` card
  is rebuilt from its four fields; otherwise non-negative integer counts, a
  hunk array with integer starts, and lines with string text and an op of
  `' '`, `'+'` or `'-'`.
- `BASIS` is `Symbol.for('luma.tool.diffBasis')`.

## Why

A card naming the file without a diff still beats nothing, and it says plainly
that it has no diff rather than implying an empty one.

`Symbol.for` makes the key process-wide, so any module (CodeWorkspace, the
extension file tools) can attach a basis without importing this class.
