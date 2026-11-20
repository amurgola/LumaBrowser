# TurnRenderer

`core/llm-server/ui/js/chat/turns/TurnRenderer.js`

Renders one message as a turn element. A message the app wrote to the model in the
user's place (a user row with provider `background-task`, a background task's results)
goes to [TaskNoticeView](TaskNoticeView.md); any other user turn to
[UserTurnView](UserTurnView.md); an assistant turn is the reasoning pane, tool
chain, sub-agent cards, the markdown body (the choices fence cut out), its
artifacts, reply chips (newest settled turn without an error only), the
[ErrorCard](ErrorCard.md) with a runtime fix, and the static action row and token
strip.

## Methods

- `render(message)`.
- `applyModeExtras(turnEl, message)`: the active mode's `renderTurnExtras` hook
  (also for user turns); a throwing hook never breaks rendering.
