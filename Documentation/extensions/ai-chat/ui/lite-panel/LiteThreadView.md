# LiteThreadView

`extensions/ai-chat/ui/lite-panel/LiteThreadView.js`

The side panel's message thread in the legacy CSS vocabulary (`.ai-msg`,
`.ai-run-group`, `.ai-msg-step`, styles in the shell).

## Methods

- `new LiteThreadView({ messagesEl, api })`.
- `showThread(messages)`: replaces the thread with finished messages.
- `appendMessage(role, content)`: "You:"/"AI:" label; assistant content
  through [LiteMarkdown](LiteMarkdown.md), user content as text.
- `startTurn()`: mounts the in-flight turn (a hidden, open `details.ai-run-group`
  "Working..." / "In progress", and an assistant message) and forgets answered cards.
- `renderTurn(state)`: with tools, shows the run group ("Working..."/"In
  progress" while running, else "Actions"/"N action(s)"), one step line per
  tool (`success`/`error`/`running`, "name: summary", "preparing..." for an
  unnamed tool) or a [LiteActionCard](LiteActionCard.md) for approval/takeover
  while running; opens the group for an action card and closes it when the turn
  ends. Paints the answer (hidden while empty and running), adds "Stopped
  before finishing." once for an aborted turn without error, and
  "Error: <message>" once for an error. The markdown is re-rendered only when
  `content` changed since the last paint and the action list only when a tool's
  name, status or summary (or `running`) changed, so a frame that merely moved
  the status phase does not re-parse the whole answer or rebuild the cards.
- `scrollToBottom()`.
