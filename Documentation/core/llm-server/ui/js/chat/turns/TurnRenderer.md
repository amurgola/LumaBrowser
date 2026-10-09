# TurnRenderer

`core/llm-server/ui/js/chat/turns/TurnRenderer.js`

Renders one message as a turn element. A user turn goes to
[UserTurnView](UserTurnView.md); an assistant turn is the reasoning pane, tool
chain, sub-agent cards, the markdown body (the choices fence cut out), its
artifacts, reply chips (newest settled turn without an error only), the
[ErrorCard](ErrorCard.md) with a runtime fix, and the static action row and token
strip.

## Methods

- `render(message)`.
- `applyModeExtras(turnEl, message)`: the active mode's `renderTurnExtras` hook
  (also for user turns); a throwing hook never breaks rendering.
