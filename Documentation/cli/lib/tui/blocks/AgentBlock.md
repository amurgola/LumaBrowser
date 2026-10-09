# AgentBlock

`cli/lib/tui/blocks/AgentBlock.js`

A delegated sub-agent's run as one row: `◇ Agent <name>` with its tool count, characters streamed,
time when done, and the error if it failed. Fields `name`, `chars`, `tools`, `error`, `startedAt`,
updated by [TurnFrames](../session/TurnFrames.md) from `agent` frames.
