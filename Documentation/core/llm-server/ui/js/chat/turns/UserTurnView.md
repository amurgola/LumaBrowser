# UserTurnView

`core/llm-server/ui/js/chat/turns/UserTurnView.js`

A user turn: each attachment spliced into the message collapsed back into its
own card (image and marked-area markers dropped: the thumbnails and area chips
represent them), the bubble with only what was typed, the editor-context chips
sent with it (live turn only), image thumbnails (the bytes held since send, else
the persisted image artifacts), the areas marked for editing (`.cm-user-regions`:
the live turn's `regions` with their previews, else the stored
`toolCalls.editRegions` with the mask standing in for the preview), then the
prompt's action row ([TurnActions](TurnActions.md)`.userActionRowHtml`).

## Methods

- `render(message)`.
- `UserTurnView.appendRegions(turnEl, message)`, `UserTurnView.regionChipHtml(row)`.
- `adoptId(message)`: the live turn painted before the server minted its id;
  stamps `data-msg-id` on the newest unstamped user turn and refreshes its row
  so Edit appears.
