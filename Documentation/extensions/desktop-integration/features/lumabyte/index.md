# lumabyte feature

`extensions/desktop-integration/features/lumabyte/index.js`

Lumabyte: Luma attached to a desktop window. Press the attach shortcut
(`Ctrl+Alt+Shift+A` by default) in any app: a small Luma button docks in that
window's bottom-left corner and a panel opens next to the window with a
conversation about it. Every message takes a fresh look at the window (a
screenshot when the model can see images, and the window's accessible text);
nothing is captured between messages and screenshots are never stored. Each
app keeps its own thread. Attaching starts a new conversation; the panel
offers the last one back ("Continue the last conversation"). On by default; Windows only for now (window tracking and capture
are Win32). Wiring: [LumabyteFeature](LumabyteFeature.md).

## Using it

- **Attach**: the shortcut in an app window attaches and opens the panel. The
  desktop, the taskbar and LumaBrowser's own windows are refused with a note on
  the activity island; at most 8 windows at a time.
- **Show or hide**: the shortcut again (from the app or the panel), a click on
  the dock, Esc in the panel or its x.
- **Follow**: the dock and panel move with the window as it moves (WinEvent
  hooks, every frame of a drag) and stay stacked directly above it, never
  always-on-top: an app in front of the window covers them too, and they rise
  with the window when it comes back to the front. Minimized, hidden or on
  another virtual desktop, both hide. Closing the window detaches.
- **From the hint**: holding Ctrl+Alt+Shift lists **A Attach** with the other
  desktop keys (**Show Lumabyte** or **Hide Lumabyte** once attached). Click it,
  or press A, to attach to the window in front, or to the window clicked while
  holding the modifiers.
- **Doing things**: ask it to act ("go into the out folder", "search for
  invoices") and it clicks, types, presses keys and scrolls in that window,
  showing each step, then answers about the result
  ([LumabyteActions](LumabyteActions.md)), up to `maxActions` per reply. Needs
  desktop control allowed in the LLM tab (Visual grounding card) and the
  `actions` setting on.
- **Reading files**: ask about a file ("summarize Andy.md") and it reads its text
  (or lists a folder) instead of opening it in an app; names resolve against the
  folder open in File Explorer ([LumabyteFiles](LumabyteFiles.md)). Needs only the
  `files` setting, not desktop control.
- **Panel tools**: New chat (shown once there are messages; the old one stays
  available to continue), continue in LumaBrowser (the thread as a
  text attachment in a new chat, not sent), detach.

## Routes

- `GET /api/desktop/lumabyte/` -> `{ success, supported, attachments: [{ hwnd, app, exe, open, busy }] }`.
- `POST /api/desktop/lumabyte/attach { hwnd?, open? }`: attaches (the foreground
  window when `hwnd` is missing). Codes `UNSUPPORTED` 501, `NO_WINDOW` and
  `OWN_WINDOW` 422, `TOO_MANY` 409.
- `POST /api/desktop/lumabyte/detach { hwnd }`: 404 when not attached.

## Settings (`settingsSchema`)

| key | type | default |
| --- | --- | --- |
| `binding` | hotkey | `Ctrl+Alt+Shift+A` (empty = no shortcut) |
| `model` | text | `''` (the chat's current model). A local model whose vision projector loads on demand counts as seeing: the first message loads it. |
| `screenshot` | bool | true (only sent when the model can see images) |
| `windowText` | bool | true (UI Automation control names and roles) |
| `actions` | bool | true (act in the window when asked, through desktop control) |
| `files` | bool | true (read a file's text or list a folder when asked) |
| `maxActions` | number (1 to 30) | 12 (clicks, keys and scrolls per reply before Lumabyte looks again; Ctrl+Alt+Shift+Escape stops a run) |
| `thinking` | bool | false (reasoning off for quicker replies) |

## Files

- [LumabyteFeature](LumabyteFeature.md): shortcut, attach and detach, the poll, IPC, routes.
- [Attachment](Attachment.md): one attached window's dock and panel.
- [AttachPlacement](AttachPlacement.md): where the dock and panel go.
- [WindowProbe](WindowProbe.md): what Windows says about the window.
- [WindowContext](WindowContext.md): the screenshot and accessible text a message carries.
- [LumabyteChat](LumabyteChat.md): one grounded turn through the chat router.
- [LumabyteActions](LumabyteActions.md): acting on the window through desktop control.
- [LumabyteFiles](LumabyteFiles.md): reading files and the folder open in File Explorer.
- [ThreadStore](ThreadStore.md): one thread per app.
- [LumabyteWindows](LumabyteWindows.md): the Electron windows.
- [WinEvents](WinEvents.md): move and foreground hooks, z-order placement.
- [ui/panel](ui/panel.md), [ui/dock](ui/dock.md), [ui/preload](ui/preload.md): the pages.
