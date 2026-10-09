# ReadFileTool

`extensions/code-mode/tools/project/ReadFileTool.js`

`read_file { path, offset?, limit? }` (a [CodeTool](../CodeTool.md)).

## Methods

- `new ReadFileTool({ workspace, guard, truncator, wholeFileMaxBytes = 0 })`.
- `handle(params)`:
  - a path still held whole ([WholeReadGuard](WholeReadGuard.md)) ->
    "You ALREADY have the COMPLETE contents of <path> ..." (`summary: <path> · already read in full`);
  - read failure -> `Could not read <path>: <message>`;
  - an explicit read (no offset/limit) within `wholeFileMaxBytes` ->
    `<path>: COMPLETE FILE, all N lines ...`, the content and an `[END OF <path>: ...]`
    marker; the claim is recorded;
  - otherwise bounded by the truncator (head) with a header and continuation in
    FILE line numbers (`(lines a-b of N)`, `offset=b+1`) and a note that the
    file is complete on disk.
  Both content results carry `noCompact: true` (already sized to the budget).
- `onResultEvicted(params)` (also on the plain tool): the agent loop dropped
  the result, so the claim drops too.
