# LiteHistoryList

`extensions/ai-chat/ui/lite-panel/LiteHistoryList.js`

## Methods

- `LiteHistoryList.render(listEl, conversations, activeId, onOpen)`: "No
  conversations yet." when empty; else one `.ai-history-item` button per
  conversation (`active` for the open one) with its title ("New chat"
  fallback, also the tooltip) and `updatedAt` as a local HH:MM time. A click
  calls `onOpen(id)`.
