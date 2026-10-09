# InstalledChatModels

`core/llm-server/service/InstalledChatModels.js`

Every chat-servable model in the models directory, as the stems `local::` refs
are built from.

## Methods

- `new InstalledChatModels({ scanner, getModelsDir, getDefaults, resolveDisplayName })`;
  `scanner.scan(dir)` is `LlmModelsScanner#scan`.
- `list()` resolves `[{ stem, display, current }]` from each scanned model's
  first weights file: models under the `NON_CHAT_DIRS` sibling folders of the
  root (`image`, `video`, `music`, `tts`, `whisper`, `stt`, `grounding`, any case)
  and repeated stems are dropped; the current default sorts first, then by display name.
- `NON_CHAT_DIRS`.

## Why

The Network Sharing host manifest offers paired clients every installed model,
not just the default; the chat router switches to a requested stem on demand.
The other servers keep their weights in sibling folders the scanner also walks,
and a Chroma or Whisper GGUF is not a chat model. The default sorts first so
callers that take "the first model" keep their behaviour.
