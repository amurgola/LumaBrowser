# ImageGenerator

`core/llm-server/ui/js/chat-ext/ImageGenerator.js`

One-shot image generation over the streaming `api.image` surface. Always
resolves an object so callers can show why a box stayed empty.

## Methods

- `ImageGenerator.generate(api, opts, timeoutMs = 1200000)` sends
  `api.image.generate({ requestId: 'imggen-...', ...opts })` and resolves the
  first image `{ b64, mime }`, or `{ error }`: "Image server unavailable.",
  "No image returned.", the error event's message, the thrown message, or
  "Timed out (model may still be loading, try again)." The 20 minute timeout is
  deliberate: edit models may (re)load for minutes on first use.
- `ImageGenerator.dataUri(img)`: `data:<mime or image/png>;base64,<b64>`.
