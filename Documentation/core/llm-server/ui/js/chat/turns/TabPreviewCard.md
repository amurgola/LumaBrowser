# TabPreviewCard

`core/llm-server/ui/js/chat/turns/TabPreviewCard.js`

The browser-tab card at the end of a tool chain: live (an empty slot the native
view covers, the last still frame underneath, Open tab) while the agent drives
it, then the final frame. Controls never overlap the slot: the native view eats
input there.

## Methods

- `create(preview, live)`.
- `applyFrame(payload)`: a still frame (~0.7/s) written into the existing card,
  never rebuilding the chain.
