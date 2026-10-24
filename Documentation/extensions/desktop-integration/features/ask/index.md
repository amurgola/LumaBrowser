# ask feature

`extensions/desktop-integration/features/ask/index.js`

"Ask Luma about this window" from any app. A desktop client sends a window
handle; Luma itself reads that window (title, app, readable text through UI
Automation, a screenshot) and opens a **new** chat conversation with the text
and the image attached under the user's prompt, through the
[chat handoff](../../shared/ChatHandoff.md). Clients that capture content on
their own can hand it over directly. On by default. Windows only (the routes
answer `503` elsewhere). The Windhawk mod
[luma-ask-window](../../../../integrations/windhawk/luma-ask-window.wh.md) is one
client; any program that can send HTTP can be another.

Exports the feature descriptor (`id: 'ask'`, `settingsSchema`, `create(deps)`)
plus `createWith(deps, parts)`, the same with test seams
(`{ capture, notify, globalShortcut, now }`). The instance has `mount(router)`,
`onSettingsChanged(key)` (re-registers the hotkey) and `dispose()` (clears it).

## Routes

All need the token. Answers use the Desktop Integration envelope.

### `POST /api/desktop/ask/window`

Body: `{ hwnd, prompt?, mode?, autoSend? }`

- `hwnd`: the window handle, a number or a string: `"0x1A2B"`, bare hex with a
  letter (`"1a2b"`), or decimal digits (`"6699"`, read as decimal). Any window
  of the app works; its top-level window is used.
- `prompt`: put in the composer; empty or missing uses the `defaultPrompt`
  setting.
- `mode`: `'text' | 'screenshot' | 'both'`; missing uses `defaultMode`.
- `autoSend`: boolean; missing uses `autoSend`.

`200`:

```json
{ "success": true, "conversationId": null, "autoSent": false, "attached": 2, "rejected": [],
  "window": { "hwnd": 4242, "title": "notes.txt - Notepad", "app": "notepad.exe" },
  "captured": { "mode": "both", "text": { "chars": 1830, "truncated": false },
                "screenshot": { "width": 1600, "height": 900, "method": "window" },
                "errors": { } } }
```

- The text attachment (`<App> window text.txt`) starts with `Window:`, `App:`
  and `Captured:` lines, then the text (capped at `maxTextChars`). When UI
  Automation finds nothing it says so, so the model knows to look at the image.
- The image attachment (`<App> window.png`) is the window as PNG, long edge at
  most 1600 px. `method`: `window` (PrintWindow), `screen-region` (the
  on-screen pixels, when PrintWindow fails or renders black).
- One part may fail and the other still goes; `captured.errors` says why
  (`{ text?, screenshot? }`).
- `source` for the handoff is `{ client: <X-Luma-Client>, app: 'Notepad', windowTitle }`.

Luma's own window: `200 { success: true, ownWindow: true, focused, window }`;
Luma just comes to the front (nothing is captured).

Errors (`{ success: false, error, code?, window? }`); the user also gets a
Windows notification with the reason when `notifyOnError` is on:

| Status | code | When |
| --- | --- | --- |
| 400 | | bad `hwnd`, `mode` or `prompt` |
| 403 | `ELEVATED` | the app runs as administrator (Windows blocks reading it) |
| 403 | `PROTECTED` | the process cannot even be queried |
| 403 | `SYSTEM_PROMPT` | UAC, Windows Security sign-in, lock or logon screen |
| 403 | `ANTI_CHEAT` | an anti-cheat protected game ([AntiCheatDetector](../../../../core/desktop/AntiCheatDetector.md)) |
| 404 | `NO_WINDOW` | no such window (closed) |
| 409 | `MINIMIZED` | the window is minimized: restore it first |
| 409 | `NOT_VISIBLE` | hidden, cloaked (another virtual desktop, a suspended Store app) or tiny |
| 409 | `BUSY` | the previous ask is still capturing |
| 422 | `CAPTURE_FAILED` | neither text nor screenshot could be taken (`errors`) |
| 503 | `UNAVAILABLE` | not Windows, or desktop capture not booted yet |
| 503 | | the chat handoff failed (e.g. the LLM tab is off) |

Reading a window sends it no input, so it does not need desktop control's
"Allow desktop control" opt-in: the user asked for it, and the feature switch
plus the token gate it.

### `POST /api/desktop/ask/content`

Body: `{ text?, imageBase64?, imageMime?, prompt?, source?: { app?, windowTitle?, client? }, autoSend? }`

For clients that capture themselves. At least one of `text`, `imageBase64` or
`prompt`. `imageBase64` may be a `data:` URL; its type is read from the bytes
(PNG, JPEG, GIF, WebP; `imageMime` is only a hint), up to 8 MB. Text is capped
at `maxTextChars`. `200 { success, conversationId, autoSent, attached, rejected, captured: { text: { chars, truncated } | null, image } }`.

### `GET /api/desktop/ask/`

The effective settings and the modes:
`{ success, defaultPrompt, defaultMode, autoSend, maxTextChars, hotkey, notifyOnError, modes }`.

## Settings (`settingsSchema`)

| Key | Type | Default | |
| --- | --- | --- | --- |
| `defaultPrompt` | textarea | `Help me with what is in this window.` | |
| `defaultMode` | select | `both` | `both`, `text`, `screenshot` |
| `autoSend` | bool | false | send at once instead of leaving it in the composer |
| `maxTextChars` | number | 20000 | 500 to 200000 |
| `hotkey` | hotkey | empty | a global shortcut (Electron accelerator, `Win` = `Super`) that asks about the window in front ([AskHotkey](AskHotkey.md)); works without any client |
| `notifyOnError` | bool | true | Windows notification on refusals and failures |

## Files

- [AskService](AskService.md): the two flows and input parsing.
- [WindowCapture](WindowCapture.md): resolve, refuse, screenshot, text, on top of `core/desktop`.
- [WindowText](WindowText.md): the one-shot UI Automation text reader.
- [AskSettings](AskSettings.md): schema and typed reads.
- [AskHotkey](AskHotkey.md): the optional global shortcut.

## Limits

- Text depends on what the app exposes to UI Automation: native apps,
  Office, browsers (after the Chromium wake) give a lot; some Electron apps,
  games, canvas and custom toolkits give little or nothing, and then the
  screenshot carries it.
- Offscreen elements are skipped, but a document's full text (TextPattern)
  is taken even when scrolled out of view.
- The capture runs before Luma comes to the front, so the screenshot shows the
  window as the user saw it.
