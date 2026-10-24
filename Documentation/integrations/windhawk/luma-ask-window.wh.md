# luma-ask-window

`integrations/windhawk/luma-ask-window.wh.cpp`

A Windhawk mod (id `luma-ask-window`, `@include *` with an `@exclude` list,
x86 and x86-64, `@compilerOptions -lwinhttp`) that adds **Ask Luma about this
window** to the window menu (title bar right-click, Alt+Space, the icon at the
top left, Shift+right-click on a taskbar button) of other apps' top-level
windows. Choosing it posts `{ hwnd, mode?, prompt?, autoSend? }` to
`POST /api/desktop/ask/window` ([ask feature](../../extensions/desktop-integration/features/ask/index.md));
Luma does all of the reading. It embeds [luma_client](_shared/luma_client.inc.md)
verbatim.

## How

- Hooks `DefWindowProcW` and `DefWindowProcA` in each process it loads into
  (the technique the all-process mods `invisible-borders` and
  `translucent-windows` use); no window is subclassed.
- Before the window menu opens (`WM_SYSCOMMAND` `SC_KEYMENU` / `SC_MOUSEMENU`,
  `WM_CONTEXTMENU` on the caption or icon, `WM_POPUPSYSTEMMENU` 0x313 from the
  taskbar) it calls `GetSystemMenu(hwnd, FALSE)`, which gives the window its
  own copy of the menu, and puts the item there, just above the separator
  before Close.
- On `WM_INITMENUPOPUP` it adds, relabels or removes the item, but only in the
  window's own copy: with the system-menu flag when Windows shows the menu, or
  without it when the app shows the same copy itself with `TrackPopupMenu`
  (Chromium, Electron and Windows Terminal do on Alt+Space). The desktop's
  shared default menu is never modified.
- `WM_SYSCOMMAND` with the item's id (0x6C50) calls `luma::AllowForeground()`,
  then `luma::PostAsync` (thread pool), and returns 0. The callback only logs;
  when Luma did not answer at all it beeps (`MessageBeep(MB_ICONWARNING)`).
  Refusals (elevated, minimized, ...) are shown by Luma as notifications.
- With "Show only while Luma is running" on (default) the item appears only
  while `luma::HasFeature("ask")` (the handshake file lists the feature and
  Luma's pid is alive): a file-attribute check and an `OpenProcess` on the UI
  thread as the menu opens, no network.
- Hotkey (optional, `Ctrl+Alt+A` style): registered only in `explorer.exe`, on
  a dedicated thread with its own message loop (`RegisterHotKey` with
  `MOD_NOREPEAT`); asks about the top-level window in front unless it is the
  taskbar or desktop. A second explorer.exe process just logs that the hotkey
  is taken.
- `Wh_ModInit` returns FALSE (the mod unloads from that process) for programs
  in the "Also skip these programs" setting and, with "Skip apps running as
  administrator" on, for elevated processes (Luma cannot read them anyway).
- `Wh_ModUninit`: stops the hotkey thread, removes the item from every menu it
  touched, `luma::Shutdown()`.

## Excluded processes

Luma itself (`LumaBrowser.exe`, `electron.exe` for dev builds), session and
security processes (csrss, winlogon, lsass, dwm, consent, LogonUI, LockApp,
CredentialUIBroker, Defender, SmartScreen), shell hosts without normal windows
(StartMenuExperienceHost, ShellExperienceHost, SearchHost, TextInputHost,
Widgets), helpers with many instances (svchost, conhost, dllhost,
RuntimeBroker, msedgewebview2), and anti-cheat protected games and their
services (EasyAntiCheat, BattlEye, Vanguard, Valorant, League, CS2, Apex,
Fortnite, Call of Duty, Overwatch, miHoYo games, FACEIT, PUBG, Rainbow Six,
Destiny 2, Tarkov).

## Settings

`menuLabel`, `mode` (`default` = Luma's setting, `both`, `text`,
`screenshot`), `prompt` (empty = Luma's default), `autoSend` (`default`, `on`,
`off`), `onlyWhenLumaRunning` (true), `skipElevated` (true), `hotkey`,
`excludedProcesses`, `apiKey`, `timeoutMs` (20000: reading a large window can
take a few seconds; the request runs on the thread pool either way).

## Why no caption button

There is no API for an extra caption button on Windows 11. The standard
buttons are drawn by DWM, and Chromium, Electron, Office, Store, WinUI and
Windows Terminal draw their own title bars; painting into the non-client area
breaks Mica, rounded corners and the snap layouts flyout, and an overlay window
per app window would have to track every move, resize, DPI, z-order,
fullscreen and virtual desktop change in every process. The window menu works
everywhere the standard frame does and costs nothing until it opens.

## Known limits

- Apps that never pass the window menu messages to `DefWindowProc`, or that
  show a menu of their own on title bar right-click (Chromium's tab strip), do
  not show the item there; Alt+Space usually still works.
- The first time a window's menu opens, Windows may still show the shared
  default menu if the open came by a path not listed above; the item then
  appears from the second time on.
- Item id 0x6C50 could in theory collide with an app's own window menu item.
