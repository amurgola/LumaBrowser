# ToolResultCompactor

`core/llm-server/agent/ToolResultCompactor.js`

Turns a tool result into the text the model reads. One per run (it numbers spills).

## Methods

- `new ToolResultCompactor(spillWriter = null)`: a
  [ToolResultSpill](../chat/ToolResultSpill.md) writer (anything with `write`), or null.
- `compact(tool, result, maxBytes = ToolOutputTruncator.DEFAULT_MAX_BYTES)`:
  - `null` -> `'null'`;
  - `screenshot`: the result without `imageBase64`, or a "pixels not visible"
    stub when there were no pixels;
  - any other result with `imageBase64`: compacted without it;
  - `noCompact`: whole, without the flag (the tool already sized it);
  - within `maxBytes`: `JSON.stringify(result)`;
  - over budget with a writer: the full result is written pretty-printed as
    `<turn>_<seq>_<tool>.json` and the model gets a size header with the path
    ([TokenSizeLabel](../chat/outline/TokenSizeLabel.md)), a
    [JsonOutliner](../chat/JsonOutliner.md) outline (`OUTLINE_TOKENS`, 500) and a
    hint (read_file/grep when the path is readable, else re-query narrower);
  - otherwise (or when the write fails): [LargeStringShrinker](LargeStringShrinker.md),
    and if still over, a hard cut plus `... (truncated)`.
