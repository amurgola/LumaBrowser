# ToolOutputTruncator

`core/llm-server/chat/ToolOutputTruncator.js`

Bounds large tool output before it enters the chat transcript. It keeps the
useful end (`head` for file reads, `tail` for command logs) within a line and
a byte limit, and returns a model-facing notice saying what was dropped and how
to get the rest ([TruncationNotice](tool-output/TruncationNotice.md)).

## Methods

- `new ToolOutputTruncator({ maxLines, maxBytes, maxLineLength })`: invalid
  values fall back to `DEFAULT_MAX_LINES` (400), `DEFAULT_MAX_BYTES` (16 KB),
  `DEFAULT_MAX_LINE_LENGTH` (500). One instance is reused across calls.
- `ToolOutputTruncator.forSlotBudget(ctxPerSlotTokens, fraction = ContextBudget.SHARES.singleToolResult)`:
  `maxBytes = tokens * fraction * 4`, and the line cap rises to
  `maxBytes / 16` so bytes stay the binding limit. A non-positive window gives
  the defaults.
- `truncate(text, { strategy = 'tail', spill })` returns
  `{ text, truncated, truncatedBy, totalLines, shownLines, totalBytes, shownBytes, notice, spilledTo }`.
  Lines longer than `maxLineLength` are cut to `<prefix>… (+N chars)` first.
  At least one line is always kept. `truncatedBy` is `'lines'` when the line
  cap stopped selection, else `'bytes'`.

## Spilling

With `spill: { writer, tool = 'output', seq = 0 }` (a
[ToolResultSpill](ToolResultSpill.md) writer) and output over budget, the FULL
text is written first (`.txt`) and the excerpt is halved (at least 20 lines and
1 KB): the model needs a taste plus the path. The notice names the file and
says to use `read_file` / `grep` on it when the writer is workspace-readable,
or to re-run narrower otherwise. A missing writer, a throw or a null write
falls back to the plain excerpt and offset notice.

## Why

Defaults are sized for the local quantized fleet, where `ctxPerSlot` shrinks as
`--parallel` rises; callers that know the slot window use `forSlotBudget`. A
static 400-line cap on a large window would make the model re-read one file
across several turns.
