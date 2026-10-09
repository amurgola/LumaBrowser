# ToolPresentation

`core/llm-server/chat/ToolPresentation.js`

What a tool result looks like to a person, separately from what the model is
told about it. The model gets bounded text; the tool card gets structure the
text threw away (which file, which lines, what changed). This class returns
that structure as replay-safe JSON, stored beside the result on the message
row and never sent to the model.

## Methods

- `ToolPresentation.present(toolName, args, result)` returns card metadata, or
  `null` when the tool has no presenter, the call failed, or the presenter
  threw. Never throws.
- `ToolPresentation.metaFromEntry(entry)` re-narrows `entry.meta` from a stored
  tool-trace entry: the validated metadata, or `undefined` so the UI falls back
  to the plain card.
- `ToolPresentation.withDiffBasis(result, before, after)` attaches the text a
  diff card is built from (`before = null` for a create). Returns `result`.
- `ToolPresentation.DIFF_BASIS` is the symbol the basis rides on
  (`Symbol.for('luma.tool.diffBasis')`); `DIFF_BASIS_MAX_CHARS` (256 KB).
- `PRESENTERS_BY_TOOL` (`edit_file`, `write_file`, `write_extension_file` ->
  [DiffCardPresenter](presentation/DiffCardPresenter.md); `read_file` ->
  [ReadCardPresenter](presentation/ReadCardPresenter.md)) and
  `PRESENTERS_BY_KIND`.

## Rules

1. **Pure.** A presenter is a function of the arguments and the result, with no
   I/O. It runs once when the call settles and again on every reload, and both
   must agree; reading the file would describe it as it is now, attached to a
   call from an hour ago.
2. **Bounded.** Whatever it returns is stored forever, so a diff is bounded to
   hunks and clipped lines, not the file.
3. **Re-narrowed on read.** `metaFromEntry` checks shape and meaning and
   returns `undefined` rather than throwing, so an old or hand-edited row falls
   back to the plain card instead of breaking its conversation.

The basis is a Symbol key because the result object is serialised into the
model-facing tool text and `JSON.stringify` skips symbol keys, so the model
never pays for two copies of a file it just wrote.

Presenters are looked up in a `Map`, so tool names such as `constructor` can
never reach a prototype method.
