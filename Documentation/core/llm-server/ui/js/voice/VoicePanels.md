# VoicePanels

`core/llm-server/ui/js/voice/VoicePanels.js`

The panels the voice controls open: setup ("Set up voice conversation" or
"Set up read aloud", noting the engines run on this computer or on the host),
the microphone picker (devices, level meter, recognition model, voice quality,
Start) and notes.

## Methods

- `new VoicePanels(api, { probe? })`; `openSetup(anchor, views, purpose)`,
  `openMic(anchor, initialErr, onStart)`, `openNote(anchor, title, text)`, `close()`, `isOpen`.
