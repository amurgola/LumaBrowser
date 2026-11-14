# ChatSwapOut

`core/image-server/service/ChatSwapOut.js`

Decides when an image launch swaps the resident chat model out instead of
loading beside it.

## Methods

- `ChatSwapOut.CHAT_SERVER_ID` `'llm'`, the chat model's ledger and hotswap id.
- `ChatSwapOut.cardToFree({ placement, role, settingsDb, claims })` returns the
  card index to free, or `null`. `placement` is
  [ImageSlotPlacement](ImageSlotPlacement.md)`.place`'s result, `claims` is
  `VramCoordinator#snapshot()`. A card is returned only when all hold:
  - the placement is a RAM offload pinned to one card;
  - the live chat claim (`claims.llm`) includes that card;
  - the [placement layout](../../shared/runtime/PlacementLayout.md) leaves both
    the image slot and the chat model automatic (no item resource, no
    singularity), and `core.llmServer.cudaDevice` is unset. An unreadable layout
    counts as placed.

## Why

ISSUES.md entry 12. With no layout, a chat model spread over a 5090 and a 3090
left a few GB on each card; the 40 GB MiniMax-H3 image model fit no card, so
automatic placement offloaded it onto the emptier 3090 and sd.cpp failed its
workspace capacity check. An offload keeps only compute buffers on the card, but
on a card the chat model has filled even those do not fit. Swapping the chat
model out is what a singularity pool does, so ImageSlotLaunch hands the card to
`HotswapCoordinator#swapOut` and places again. An offload onto a card the chat
model does not use, any resident or split placement, and every user placement
behave as before.
