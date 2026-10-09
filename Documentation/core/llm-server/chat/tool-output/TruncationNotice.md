# TruncationNotice

`core/llm-server/chat/tool-output/TruncationNotice.js`

The model-facing notice for truncated tool output from
[ToolOutputTruncator](../ToolOutputTruncator.md).

## Methods

- `TruncationNotice.build(shownLines, { totalLines, totalBytes }, strategy, spilled = null)`:
  - plain: `[Output truncated: showing last|first N of M lines (X.X KB total).]`,
    plus ` Use offset=N+1 to read further.` for `head`.
  - spilled: `[Output truncated: showing last|first N of M lines. Full output (X.X KB, ~T tokens) saved to <displayPath>. ...]`
    ending with "Use read_file or grep on that path for the rest." when
    `spilled.readable`, else "Re-run with a narrower query if you need the rest."
    Tokens are the bytes over `SPILL_BYTES_PER_TOKEN` (3: logs and JSON tokenize denser than prose, so the
    estimate errs high), formatted by [TokenSizeLabel](../outline/TokenSizeLabel.md)`.format` (e.g. `~13,000`).
