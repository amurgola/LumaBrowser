# HeaderBlock

`cli/lib/tui/blocks/HeaderBlock.js`

The session header: `new HeaderBlock({ title, sub, hint })` renders the title (truncated), then each
non-empty sub line and the hint wrapped and indented by two. The texts arrive styled
([App](../session/App.md) builds them: mark, product and agent; folder; model, resumed messages,
approvals; key hint or a one-off note). Done on creation.
