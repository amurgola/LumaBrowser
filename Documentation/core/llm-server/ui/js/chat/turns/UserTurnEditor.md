# UserTurnEditor

`core/llm-server/ui/js/chat/turns/UserTurnEditor.js`

Edit and resend a prompt: the user bubble (and its action row) hide behind a
textarea holding only what was typed; attached files stay attached. Send calls
[TurnSender](../stream/TurnSender.md)`.resend`, which branches the conversation
from that prompt with a fresh reply; the original prompt and everything after it
stay reachable through the prompt's pager. Enter sends, Shift+Enter is a new
line, Escape cancels. An empty prompt is refused; an unchanged one still
resends.

## Methods

- `edit(message, turnEl)`: ignored while streaming or when already editing.

## Globals

None.
