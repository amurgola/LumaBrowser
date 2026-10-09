# VoiceStore

`extensions/chatterbox-voice/VoiceStore.js`

The cloned-voice profiles the "Voice cloning" tab manages.

## Layout

Under `<appBaseDir>/models/tts/chatterbox/` (next to the GGUFs; the core TTS
scanner ignores it because there is no `.onnx` inside):

- `voices.json`: `[{ id, name, description, language, referenceText, refSec, refHz, refRmsDb, createdAt, updatedAt }]`
- `voices/<id>/ref.wav`: the normalized reference clip.

## Methods

- `new VoiceStore(rootDir)`; fields `rootDir`, `file`, `voicesDir`.
- `refPath(id)`, `list()` (rows whose clip still exists), `get(id)` (or null).
- `create(fields, wav)` validates the name, prepares the clip, writes it and
  appends a row with id `v-<10 hex>`; language normalized.
- `update(id, patch, wav?)` patches `name`, `description`, `language`,
  `referenceText`; a clip (with optional `patch.trimStartSec`) is re-prepared
  and replaced. Throws `Voice not found.` or `A voice needs a name.`.
- `remove(id)` deletes the row and folder; returns whether it existed.
- `VoiceStore.prepareClip(wav, fields)` validates, trims and normalizes through
  [AudioAnalysis](AudioAnalysis.md), then validates again (a trim can make it
  too short); returns `{ wav, refSec, analysis }`.
- `VoiceStore.validateClip(wav)` returns seconds or throws: not a WAV, shorter
  than `MIN_REF_SEC` (3), longer than `MAX_REF_SEC` (40), or silent (peak under 0.01).
- `VoiceStore.normLanguage(lang)` first two letters lowercased, else `en`.

## Why

A plain JSON file rather than the extension DB: the profiles are tiny, the clip
is a file anyway, and a user can back the folder up as a unit. The stored clip
is the normalized one because that is what the engine conditions on. Writes go
through a temp file and rename.
