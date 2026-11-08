# ReactionScope

`extensions/roleplay-mode/pipeline/ReactionScope.js`

One running post-turn reaction: its conversation and reply, whether it is still
wanted, and the abort signal its side completions carry. Rides the async
context (`AsyncLocalStorage`), so model calls deep in the pipeline find it.

## Methods

- `new ReactionScope({ conversationId, messageId, onStopImages })`; fields
  `phase` (`'world'` | `'images'`), `reason`, `seq`, `reconciled` (a promise).
- `signal`, `stopped`, `stop(reason = 'replaced')` (aborts the signal, ends the
  world phase, calls `onStopImages` during the image phase; true when this call
  stopped it), `throwIfStopped()` (code `RP_REACTION_STOPPED`, message from
  `REASONS`: replaced, deleted), `reasonText()`, `markReconciled()`,
  `isReconciled`.
- `ReactionScope.run(scope, fn)`, `ReactionScope.current()`,
  `ReactionScope.isStop(err)`.
