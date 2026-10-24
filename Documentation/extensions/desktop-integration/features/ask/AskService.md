# AskService

`extensions/desktop-integration/features/ask/AskService.js`

The logic behind the [ask feature](index.md)'s routes. Every method returns
`{ status, body }` with the Desktop Integration envelope and never throws.

`new AskService({ settings, handoff, windows, capture, notify, log, now })`:
`settings` is the feature's FeatureSettings (read through [AskSettings](AskSettings.md)),
`handoff` the [ChatHandoff](../../shared/ChatHandoff.md), `windows`
[AppWindows](../../shared/AppWindows.md), `capture` a [WindowCapture](WindowCapture.md),
`notify(title, body)` shows a Windows notification, `now()` is a test seam.

## Methods

- `askWindow(body, client)`: validates `{ hwnd, prompt?, mode?, autoSend? }`,
  resolves the window (`capture.describe`), raises Luma for its own window,
  turns refusals into their status and code, takes the screenshot first and
  the text second (each may fail alone), and hands the parts to the chat. One
  ask at a time: a second one while the first captures gets `409 BUSY`.
- `askForeground(client = 'luma-hotkey')`: `askWindow` on the top-level window
  in front (the hotkey).
- `askContent(body, client)`: `{ text?, imageBase64?, imageMime?, prompt?, source?, autoSend? }`
  straight to the chat.
- `config()`: the effective settings plus `modes`.

Failures go through `_failed`: logged as a warning and, with `notifyOnError`
on, shown as a notification titled "Ask Luma".

## Statics

- `MODES`: `['text', 'screenshot', 'both']`.
- `parseHwnd(value)`: a positive safe integer from a number, `"0x..."` hex,
  decimal digits, or bare hex containing a letter; else null.
- `parseImage(value, mimeHint)`: base64 or a `data:` URL to `{ data, mime, ext }`
  or `{ error }`; the type is sniffed from the magic bytes (PNG, JPEG, GIF,
  WebP), the hint is used only when sniffing fails. Larger than 8 MB of image
  bytes (`MAX_IMAGE_BASE64`) is rejected.

Attachment names are built from the app name (`notepad.exe` becomes
`Notepad`) with path and reserved characters removed, at most 60 characters.
