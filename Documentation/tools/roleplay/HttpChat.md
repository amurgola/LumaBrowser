# HttpChat

`tools/roleplay/HttpChat.js`

The roleplay extension's `context.chat`, stood up over an OpenAI-compatible
chat endpoint (the app's Local API or a bare llama-server) so the mode's real
narrator turn and side calls run from the terminal with no Electron in the
loop. Text only: the image hooks answer "not ready", so `postProcess` does its
memory work and stops.

## Methods

- `new HttpChat({ baseUrl, log, think, fetchImpl })`.
- `HttpChat.body(opts, { think })` the request body for one
  `chat.complete(opts)`: messages, temperature, `max_tokens`
  (`SIDE_CALL_MAX_TOKENS` 1500 for `noThink` calls, else
  `NARRATOR_MAX_TOKENS` 900, or `opts.maxTokens`), `stream: false`,
  `chat_template_kwargs: { enable_thinking: false }` unless thinking is left
  on for the narrator, and the mode's `samplers` (DRY, XTC, min-p) spread at
  the top level, which llama-server's OpenAI route passes through.
- `complete(opts)` -> `{ text }` (reasoning blocks stripped) or `{ error }`,
  never throws; honours `opts.timeoutMs` (default 300 s). Each call is logged
  and kept in `calls` as `{ kind, ms, error, chars, usage }`, the kind read
  from the system prompt's marker (narrator, stage, profile, pressure,
  consolidate, polish, judge).
- `isImageReady()` false, `visionAvailable()` false, `generateImage()` null,
  `beginExclusiveImage()`, `endExclusiveImage()`, `warmImageSlot()`,
  `registerMode()`, `uiUrl(rel)`.
