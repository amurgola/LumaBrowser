# VramPressureText

`core/llm-server/server/vram-watchdog/VramPressureText.js`

The VRAM pressure banner copy for one card.

## Methods

- `VramPressureText.describe(card)` for a watchdog card view:
  `RTX 5090 is down to 614 MB free (reserve 1.00 GB). Another app may be using it; generations can fail or slow.`
  The low band ends `long generations may slow down.` A nameless card is
  `GPU <card>`. Sizes use [ByteLadder](../ByteLadder.md); zero free reads `0 B`.
