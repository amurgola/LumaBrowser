# ChatSwapOut

`core/image-server/service/ChatSwapOut.js`

Decides when an image launch swaps the resident chat model out instead of
falling back to RAM. The automatic flow (2026-11-25): a card or split that holds
the model takes it; else a card the chat model holds that holds the whole model
once the chat model leaves is freed (the biggest such); else the model streams
from RAM, and a chat model crowding the card the offload runs on still leaves,
because sd.cpp needs room there for its compute buffers.

## Methods

- `ChatSwapOut.CHAT_SERVER_ID` `'llm'`, the chat model's ledger and hotswap id.
- `ChatSwapOut.cardToFree({ placement, role, settingsDb, claims, cards, requiredBytes })`
  returns the card index to free, or `null`. `placement` is
  [ImageSlotPlacement](ImageSlotPlacement.md)`.place`'s result, `claims` is
  `VramCoordinator#snapshot()`, `cards` is `VramCoordinator#debitedDevices`
  with the image slot's own claim left out, and `requiredBytes` is the image
  model's need. A card is returned only when all hold:
  - the placement would use RAM: a RAM offload, or (one card box) the placement
    is unpinned, `cards` holds exactly one card with a known free reading, and
    `requiredBytes` exceeds that card's room (free VRAM less the GPU headroom,
    `CudaDevicePicker.cardRoomBytes`);
  - the card is `freeableCard`'s answer, else the card the offload runs on (the
    offload's card, or a one card box's only card);
  - the live chat claim (`claims.llm`) includes that card;
  - the [placement layout](../../shared/runtime/PlacementLayout.md) leaves both
    the image slot and the chat model automatic (no item resource, no
    singularity), and neither `core.llmServer.cudaDevice` nor
    `core.imageServer.cudaDevice` is set. An unreadable layout counts as
    placed.

- `ChatSwapOut.freeableCard(chat, cards, requiredBytes)` the chat model's card
  that holds the whole model once the chat model leaves, the biggest first
  (lowest index on a tie), skipping cards with an unknown free reading; null
  when none would.
- `ChatSwapOut.roomOnceFreed(chat, card)` the card's room now plus the chat
  claim's share of it (its split weight, else an even share), capped at the
  card's total less the reserve. A chat claim with no size counts as holding
  everything its card uses.

The chat claim of an engine that picks its own card (Basalt) comes from
[LlmPlacement](../../llm-server/server/launcher/LlmPlacement.md)
`claimCustomLaunch`; before 2026-11-25 such an engine had no claim, so it was
never swapped out.

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

The one card case was added after: on a one card box
`VramCoordinator._reserveAutomatically` never pins, so the placement never says
"offload" and the image model loaded beside the chat model in whatever VRAM was
left. Now the need is weighed against the card's room instead; a model that fits
beside the chat model still loads beside it. The image device setting is
checked too because its "never pin" value (`''`) produces the same unpinned
placement; on two cards it never offloads, so that check changes nothing there.
