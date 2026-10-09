# UserTurnView

`core/llm-server/ui/js/chat/turns/UserTurnView.js`

A user turn: each attachment spliced into the message collapsed back into its
own card (image markers dropped: the thumbnails represent them), the bubble with
only what was typed, the editor-context chips sent with it (live turn only), and
image thumbnails (the bytes held since send, else the persisted image artifacts),
then the prompt's action row ([TurnActions](TurnActions.md)`.userActionRowHtml`).

## Methods

- `render(message)`.
- `adoptId(message)`: the live turn painted before the server minted its id;
  stamps `data-msg-id` on the newest unstamped user turn and refreshes its row
  so Edit appears.
