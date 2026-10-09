# VoicePreview

`extensions/chatterbox-voice/VoicePreview.js`

Renders a preview sentence with a voice.

## Methods

- `VoicePreview.render({ engine, store, voiceId, text? })` (shorthand for
  `new ...(o).execute()`) resolves `{ wavBase64, ms, seconds, hz, refHz }`.
  A voice that is not ready rejects with the engine's `error` and `code`. Text
  defaults to `DEFAULT_TEXT` and is cut to 300 characters; speed is 1. The
  streamed Int16 chunks are stitched into one WAV; `hz` is the preview's median
  pitch and `refHz` the stored clip's.

## Why

The result's pitch next to the reference's is the quickest way to tell "the
clone sounds higher" from "the recording was thin".
