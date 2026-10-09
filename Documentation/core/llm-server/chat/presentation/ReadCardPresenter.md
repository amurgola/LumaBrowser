# ReadCardPresenter

`core/llm-server/chat/presentation/ReadCardPresenter.js`

The read card for `read_file`: which slice of which file the model actually
got. Extends [ToolCardPresenter](ToolCardPresenter.md).

## Methods

- `ReadCardPresenter.present(args, result)` returns
  `{ kind: 'read', path, offset, lines, totalLines }`. `offset` comes from the
  result, else `args.offset`; `lines` from `result.lines`, else
  `result.lineCount`. Each is a positive integer (floored) or `null`. Returns
  `null` for a failed call, a missing path, or when all three numbers are null
  (nothing worth a card beyond the path).
- `ReadCardPresenter.validate(meta)`: non-empty path, each number missing or a
  positive integer, and `offset` not past `totalLines`.

## Why

A window that claims to start past the end of its own file describes nothing;
rendering it would be a confidently wrong card, worse than the plain fallback.
