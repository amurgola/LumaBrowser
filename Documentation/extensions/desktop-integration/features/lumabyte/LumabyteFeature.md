# LumabyteFeature

`extensions/desktop-integration/features/lumabyte/LumabyteFeature.js`

Wires the [lumabyte feature](index.md).

- `static settingsSchema()`, `static defaultParts(deps)` (the extension's
  shortcut backend `deps.shortcuts`, [GlobalShortcuts](../../shared/GlobalShortcuts.md):
  Electron, or the X11 bridge on Wayland; Electron's own without one, a [WindowProbe](WindowProbe.md), the chat router, a
  [ThreadStore](ThreadStore.md) at `<userData>/lumabyte/threads.json`,
  [LumabyteWindows](LumabyteWindows.md), and on Windows a
  [WindowContext](WindowContext.md) over desktop control's `Win32` capture, its
  own `UiaHost` (closed on dispose) and `WindowObserver`).
- `constructor(deps, parts)`; `start()` registers the shortcut
  ([HotkeyBindings](../hotkeys/HotkeyBindings.md)) and the IPC handlers.
- `toggleForeground()`: the shortcut. The window in front (its root owner, so a
  dialog counts as its app) is attached and its panel opened, or, already
  attached (or the panel itself in front), its panel toggled.
- `attach(hwnd, { open })`, `detach(hwnd)`, `list()`.
- Following: while anything is attached, [WinEvents](WinEvents.md) hooks run
  each attachment's `sync` on every move of its window and `tick()` on every
  foreground change or minimize; the poll (`EVENT_POLL_MS`, 500 ms, or
  `POLL_MS`, 120 ms, when the hooks are unavailable) catches the rest.
- Hint: `start()` adds `hintEntries` to `deps.hints`
  ([HintContributions](../../shared/HintContributions.md)): **Attach** (with a
  note naming the app), **Show** or **Hide Lumabyte** once attached, disabled
  for the shell or Luma's own windows. `run` and the shortcut while the hint is
  up (`fire()`) use the window picked on the hint, else the one in front
  (`attachOrToggle`).
- Refusals (`NO_WINDOW`, `OWN_WINDOW`, `TOO_MANY`, `UNSUPPORTED`) show on the
  activity island (`deps.overlay`) for `NOTICE_MS`.
- IPC (`ext.desktop-integration.lumabyte.*`, answered only for the webContents
  of an attachment's own dock or panel): `panel.state` (app, title, thread,
  `previous`, `LumabyteChat.capabilities()`, busy), `panel.send { text }` (one turn at a
  time; events go back to the panel), `panel.stop`, `panel.clear`, `panel.resume`,
  `panel.close`, `panel.detach`, `panel.openInLuma` (the thread through
  `deps.handoff`, capped at `TRANSCRIPT_MAX_CHARS`), `dock.toggle`.
- A new attachment clears the app's thread (`ThreadStore.clear` keeps it as the
  previous one), so each attach starts a new conversation.
- Broadcasts `lumabyte.attachments` on every attach and detach.
- `mount(router)`, `onSettingsChanged('binding')`, `dispose()`, `instance()`,
  `static statusFor(code)`.
