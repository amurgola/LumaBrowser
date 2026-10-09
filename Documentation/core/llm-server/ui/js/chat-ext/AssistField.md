# AssistField

`core/llm-server/ui/js/chat-ext/AssistField.js`

The AI-fill button inside a text box: the field's `assist()` says what to
generate, this streams the draft in while the box is locked and shimmering, and
the sparkle becomes a stop button that keeps the partial draft.

## Methods

- `new AssistField(wrap, input, field, { api, model, rootModel, siblingModel }).attach()`
  wraps `input` in `.cm-xassist-wrap` (`--area` for textareas) with the button
  rail, and appends the `.cm-xassist-status` line to `wrap`.
- Click: `field.assist({ api, model, rootModel, siblingModel, value, setStatus })`
  returns `{ messages, temperature?, modelRef?, timeoutMs?, noThink? }` to
  stream, a string to set directly, or `null`. Streams over
  `api.chat.completeStream` + `api.onChatEvent` (`delta`, `reasoning`, `done`,
  `error`); falls back to one-shot `api.chat.complete`; otherwise says "AI
  drafting is only available in the desktop app." The final text goes through
  `field.assistClean(text)` or strip-think + trim.
- Stop calls `api.chat.completeAbort(requestId)` and settles with the partial
  after 1.5 s if no `done` arrives.
- `AssistField.stripThink(text)`, `ASSIST_ICON`, `STOP_ICON`.
