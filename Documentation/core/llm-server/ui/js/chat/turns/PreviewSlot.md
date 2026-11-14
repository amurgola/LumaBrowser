# PreviewSlot

`core/llm-server/ui/js/chat/turns/PreviewSlot.js`

The rectangle reserved for the agent's live working tab. The tab is a native
view the main process parks over this rectangle, so the slot reports its
position (once per animation frame, only on change) through
`api.tabPreview.rect`. A half-scrolled slot reports `visible: false` (the page is
resized to the rect, not cropped).

## Methods

- `bind(slotEl)`, `poke()`, `release()` (reports an empty, hidden rect).

## Slot height

The page is only parked over the slot while the whole slot is inside the chat's scroll area (`_rect` reports `visible` on full containment). The slot is 16:10 at the column's width, so `chat.css` caps it with `max-height: max(160px, calc(100vh - 300px))`. Without the cap, a window under roughly 750 CSS px of content height (a 720p display, a window that is not maximized) had a slot taller than the scroll area: every rectangle went out as not visible, the page was never shown, and with no painted view there was no frame for the fallback image either, so the card stayed an empty box. Found 2026-11-13 while recording in a 1280x720 window.
