# PreviewSlot

`core/llm-server/ui/js/chat/turns/PreviewSlot.js`

The rectangle reserved for the agent's live working tab. The tab is a native
view the main process parks over this rectangle, so the slot reports its
position (once per animation frame, only on change) through
`api.tabPreview.rect`. A half-scrolled slot reports `visible: false` (the page is
resized to the rect, not cropped).

## Methods

- `bind(slotEl)`, `poke()`, `release()` (reports an empty, hidden rect).
