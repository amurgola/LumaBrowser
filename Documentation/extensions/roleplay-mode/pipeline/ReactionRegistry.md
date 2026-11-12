# ReactionRegistry

`extensions/roleplay-mode/pipeline/ReactionRegistry.js`

The post-turn reactions running in this process, per conversation.

## Methods

- `new ReactionRegistry({ waitMs = 90000 })`.
- `start(conversationId, messageId, onStopImages)`: a new
  [ReactionScope](ReactionScope.md); stops an older one for the same reply.
  `end(scope)`.
- `supersedeOffPath(conversationId, pathIds, reason)`: stops the reactions for
  replies outside the path a new turn continues from (a regenerate, an edited
  prompt). Returns the count.
- `settled(conversationId, pathIds, signal)`, `waitForEarlier(scope)`: resolve
  once the world phase of the reactions on the path (or of every earlier one
  in the conversation) is over, or after `waitMs`. `signal` (the waiting
  turn's abort signal, optional) ends the `settled` wait as soon as it fires;
  an already aborted signal never waits. The reactions themselves are not
  stopped by it.

## Why

A regenerate used to queue behind the replaced reply's stage, casting and
consolidation calls (and its image window, which stops the LLM on one GPU)
with nothing on screen saying why. The next turn also read the state before its
previous reply's world update landed.
