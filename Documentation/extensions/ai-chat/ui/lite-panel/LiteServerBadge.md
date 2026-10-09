# LiteServerBadge

`extensions/ai-chat/ui/lite-panel/LiteServerBadge.js`

Paints the compact LLM availability onto the toolbar.

## Methods

- `new LiteServerBadge({ toggleBtn, stateDot, contextEl })`.
- `paint(st, contextLabel)`: the dot class is `luma-dot ai-chat-state-dot`
  plus `ok` (ready), `busy` (starting, busy, waiting), `bad` (error), or
  `warn` for `off` when not configured; the toggle is enabled with title and
  aria-label "AI Chat: <label or status> (<model>)" or "AI Chat: No model
  configured, open the LLM tab". `contextLabel` (null to skip) fills the header
  model label, used only when the panel has no picker.

## Globals

Reads the shell-owned `#aiChatToggle` and `#aiChatStateDot`.
