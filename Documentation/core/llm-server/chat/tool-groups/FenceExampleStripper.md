# FenceExampleStripper

`core/llm-server/chat/tool-groups/FenceExampleStripper.js`

Removes the literal `{ "tool": ..., "params": { ... } }` text-protocol examples
from a group manual for native-tool routes.

## Methods

- `FenceExampleStripper.strip(doc)`: a block starts on a line matching
  `{ "tool":` and is dropped once its brace depth returns to zero. A block
  still open at `MAX_BLOCK_LINES` (40) or at the end of the doc is kept (it was
  prose with a brace, or a broken example). Dangling `Params:` labels are
  removed, runs of blank lines collapse to one, the result is trimmed. Null
  gives `''`.

## Why

Each manual teaches its tool twice: as guidance and as a fence example. On a
native route the registered schema is the contract and the fence teaches a
protocol the model is not using. Measured at 236 tokens off an artifacts turn
and about 14% of all manuals. Held lines are only dropped once the block is
known to close, so an unbalanced example costs itself, not the rest of the doc.
