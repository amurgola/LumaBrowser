# WhisperInferenceClient

`core/whisper-server/service/WhisperInferenceClient.js`

Sends one utterance to a running whisper-server and returns the transcript.

## Methods

- `WhisperInferenceClient.transcribe({ port, wav, language?, timeoutMs = 60000 })`
  posts a [MultipartForm](MultipartForm.md) (`response_format=json`, plus
  `language` unless it is empty or `auto`, and `file` as `utterance.wav`) to
  `http://127.0.0.1:<port>/inference` and resolves the `text`, whitespace
  collapsed to single spaces and trimmed. Rejects with:
  - `whisper-server HTTP <status>: <first 200 chars>` for a status of 400 or more;
  - `whisper-server returned a non-JSON response: <first 200 chars>`;
  - `whisper-server: <error>` when the JSON has an `error` field;
  - `whisper-server request timed out`.
- Statics: `TIMEOUT_MS`, `HOST`, `ERROR_PREVIEW_CHARS`.

## Why

Whisper joins segments with newlines, but spoken audio has no meaningful line
structure and the chat bubble renders pre-wrap, so every segment break would
show as a hard line break.
