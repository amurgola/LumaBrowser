# Clipboard

`core/llm-server/ui/js/dom/Clipboard.js`

Copies text to the clipboard with a fallback.

## Methods

- `Clipboard.copyText(text)` resolves `true` on success. It tries
  `navigator.clipboard.writeText` first; when that is missing or rejects (it
  needs a secure context that some origins such as `file://` lack) it copies
  through `document.execCommand('copy')` over a hidden, temporary textarea and
  resolves its result (`false` if it throws). Call it inside a user gesture so
  the fallback is allowed.

## Globals

Reads `navigator.clipboard` and `document`.
