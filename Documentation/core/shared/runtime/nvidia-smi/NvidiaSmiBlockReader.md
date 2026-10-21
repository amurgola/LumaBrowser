# NvidiaSmiBlockReader

`core/shared/runtime/nvidia-smi/NvidiaSmiBlockReader.js`

Turns the chunked stdout of a looping nvidia-smi query into blocks of card rows
for [NvidiaSmiStream](../NvidiaSmiStream.md). Rows are keyed by the card's own
`index` field (parsed by
[NvidiaSmiOutputParser.parseGpuRow](../NvidiaSmiOutputParser.md)), never by
line position.

## Methods

- `new NvidiaSmiBlockReader({ onBlock, expectedCount, parseRow })`.
  `onBlock(rows, { complete })` gets rows sorted by index; `expectedCount` seeds
  the card count (a restarted loop already knows it); `parseRow` is a test seam.
- `feed(chunk)` splits on newlines, keeps a partial trailing line for the next
  chunk, and takes each line: a malformed line is counted and skipped; a repeated
  index flushes the block (the next iteration began) before the row starts a new
  one; reaching the expected count flushes.
- `flush()` publishes the pending block, complete or not; true when something
  was published. `complete` is `rows.length >= expectedCount`. The expected
  count only grows, so a block short by one malformed line never teaches the
  reader to publish short blocks for good.
- `end()` takes the partial tail as a line, then flushes.
- `reset()` drops the pending block and tail.
- `hasPending()`, `expectedCount`, `malformedLines`.

## Why

`nvidia-smi -lms` prints no separator between iterations, so a block boundary
has to be inferred: from the count once known, from a repeated card, or from a
short quiet gap (the stream's settle timer calls `flush`).
