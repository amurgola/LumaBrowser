# SmokeErrorFormatter

`extensions/game-mode/smoke/SmokeErrorFormatter.js`

Formats one runtime error for the agent: message, the game-relative `file:line` from the first useful stack frame (window.onerror's line is document-relative junk for inlined scripts), a repeat count, and two frames without engine or harness noise.

## Methods

- `prettySource(s)`, `stackFrames(stack, max)`, `format(error, index)` (`1. <message> at <file>:<line> (xN)`).
