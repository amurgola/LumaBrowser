# VoiceRadioRow

`core/llm-server/ui/js/voice/VoiceRadioRow.js`

One radio row of the picker (microphone, recognition model, voice).

## Methods

- `create({ group, text, checked, title?, onChange })` returns `{ row, radio, span }`.
- `tooltip(entry)`: the row's hover text, the entry's description (or name) then `License: <license>` when the
  catalog gives one, so CC-BY models (Pocket TTS, Parakeet, Piper LibriTTS-R) carry their credit where they are
  chosen. Full notices: the speech-models section of `THIRD-PARTY-LICENSES`.
- `downloadSuffix(sizeBytes)`: " · N MB download".
