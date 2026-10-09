# ReasoningBlock

`cli/lib/tui/blocks/ReasoningBlock.js`

The model's thinking.

## Members

- `new ReasoningBlock({ shown })`; fields `text`, `shown`, `startedAt`, `endedAt`; getter `chars`.
- `render`: shown, the whole text italic and muted; folded, nothing while it streams (the session
  draws [ThinkingPreview](../chrome/ThinkingPreview.md) instead) and `· thought for Ns` once done.
