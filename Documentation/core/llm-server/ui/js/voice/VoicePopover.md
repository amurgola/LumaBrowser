# VoicePopover

`core/llm-server/ui/js/voice/VoicePopover.js`

The one voice popover at a time (`.cm-voice-pop`), positioned above its
anchor and capped (`max-height`, scrolling inside) to the room between the
anchor and the window top, so long model lists never run off screen. It is
closed by a press outside; a press on the mic or read-aloud button is
left to that button's own toggle.

## Methods

- `new VoicePopover({ onClose? })`; `open(anchor, html)` (`null` without an
  anchor), `openNote(anchor, title, text)`, `close()`, `isOpen`, `element`.
