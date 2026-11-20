# InstalledChatModels

`core/llm-server/service/InstalledChatModels.js`

Every chat-servable model in the models directory, as the stems `local::` refs
are built from. The last listing is kept for callers that cannot wait for a scan.

## Methods

- `new InstalledChatModels({ scanner, getModelsDir, getDefaults, resolveDisplayName, now = Date.now })`;
  `scanner.scan(dir)` is `LlmModelsScanner#scan`; `now` is a test seam.
- `list()` always scans and records the listing; resolves `[{ stem, display, current }]` from each scanned model's
  first weights file: models under the `NON_CHAT_DIRS` sibling folders of the
  root (`image`, `video`, `music`, `tts`, `whisper`, `stt`, `grounding`, any case)
  and repeated stems are dropped; the current default sorts first, then by display name.
  Two files that resolve to one display name (two quants of a model) also name their
  file, `Qwen 3.8 27B UD (Qwen3.8-27B-UD-IQ2_S)`, so a picker never shows two identical rows.
- `fresh(maxAgeMs = FRESH_MS)` the same rows, scanned again only when the last scan is
  older than `maxAgeMs`; concurrent callers share one scan.
- `snapshot()` the rows of the last scan at once (`[]` before the first), read against the
  current default and display names; a listing older than `SNAPSHOT_STALE_MS` is renewed in the background.
- `pathOf(stem)` resolves the weights file a `local::<stem>` ref loads, or null when not installed.
- Statics: `NON_CHAT_DIRS`, `FRESH_MS` (5 s), `SNAPSHOT_STALE_MS` (60 s).

## Why

The Network Sharing host manifest offers paired clients every installed model,
not just the default; the chat router switches to a requested stem on demand.
The computed local provider entry lists them too, so every model picker offers
any installed model; it is built synchronously, hence `snapshot()`.
The other servers keep their weights in sibling folders the scanner also walks,
and a Chroma or Whisper GGUF is not a chat model. The default sorts first so
callers that take "the first model" keep their behaviour.
