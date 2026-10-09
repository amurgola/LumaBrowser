# Block

`cli/lib/tui/blocks/Block.js`

Base of every transcript block: plain state plus `render(width, theme, { spinner })` returning lines
within `width`. The session ([SessionView](../session/SessionView.md)) commits done blocks at the head
of the transcript to scrollback and repaints the rest.

## Members

- `render(width, theme, opts)`: subclasses implement it; the base throws.
- `done`: a done block at the head of the transcript is committed.
- `frozen`: leading lines already pushed into scrollback while the block was still live (a long
  streaming answer), skipped when it renders into the live region.
- `Block.INDENT`: two spaces.

Implementations: [UserBlock](UserBlock.md), [AssistantBlock](AssistantBlock.md), [ReasoningBlock](ReasoningBlock.md), [ToolBlock](ToolBlock.md), [AgentBlock](AgentBlock.md), [ArtifactBlock](ArtifactBlock.md), [NoteBlock](NoteBlock.md), [ErrorBlock](ErrorBlock.md), [SummaryBlock](SummaryBlock.md), [HeaderBlock](HeaderBlock.md).
