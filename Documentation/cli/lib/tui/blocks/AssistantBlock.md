# AssistantBlock

`cli/lib/tui/blocks/AssistantBlock.js`

One segment of the model's answer (`text`, appended as it streams), rendered through
[MarkdownRenderer](../markdown/MarkdownRenderer.md), indented, after a blank line; nothing while the
text is blank. A tool card or artifact seals the segment and the next text starts a new block.
