# luma-explorer-actions

`integrations/windhawk/luma-explorer-actions.wh.cpp`

A Windhawk mod (id `luma-explorer-actions`, `@include explorer.exe`,
`@architecture x86-64`, `@compilerOptions -lwinhttp -lcomctl32 -lole32 -luuid`)
that adds a **Luma** submenu to Explorer's classic right-click menu, filled from
the [file-actions](../../extensions/desktop-integration/features/file-actions/index.md)
feature for the current selection. Embeds [luma_client](_shared/luma_client.inc.md)
verbatim.

## Hook point

Three entry points are hooked, because builds differ in which one Explorer's
folder view calls: `user32!TrackPopupMenuEx`, `user32!TrackPopupMenu` (what
Windows 11 IoT LTSC 24H2, build 26100, uses for the classic file menu, verified
with the trace in v1.2) and `win32u!NtUserTrackPopupMenuEx` (which the other two
call). The outermost call on a thread handles the menu and nested calls pass
straight through, so a menu is never handled twice. Each menu is filtered hard:

- `TPM_RETURNCMD` set, the owner window on the calling thread and inside a
  `SHELLDLL_DefView` (the folder view of an Explorer tab or the desktop);
- the menu has a default item (item menus have Open; background, column header
  and view menus do not);
- `luma::HasFeature("file-actions")` (handshake only, no request);
- the view's selection, read through `IShellBrowser` (`WM_USER + 7`,
  CWM_GETISHELLBROWSER, asked only of ShellTabWindowClass, CabinetWClass,
  ExploreWClass, Progman, WorkerW) then `IFolderView2::GetSelection`, is
  1 to `maxItems` file-system items.

Anything else passes straight to the original. With the classic menu (the
`explorer-context-menu-classic` mod, or Show more options), CDefView shows the
selection's menu this way and invokes the returned id; ours (0xE600 and up,
far above the shell's 0 to 0x7FFF range) are handled by the mod, which then
returns 0 so the view invokes nothing. Our items are removed again before the
hook returns.

## Never blocking

- `POST /file-actions/available` starts on the thread pool when the menu opens.
- The owner window is subclassed for the duration of the menu; on
  `WM_INITMENUPOPUP` for the Luma submenu (the user hovers it) the submenu is
  filled, waiting at most `fetchTimeoutMs` (default 150, counted from menu
  open), else from a cache keyed by selection kind (sorted extensions or
  `<dir>`, one vs many), else a single "Ask Luma about this" (`action: 'ask'`).
  A kind Luma answered "no actions" for gets no submenu next time.
- Picking an item: `luma::AllowForeground()` then async `POST /file-actions/run`.

## Settings

`menuLabel` (Luma), `menuPosition` (`bottom`: above Properties; `top`),
`fetchTimeoutMs` (0 to 1000), `maxItems` (1 to 100, default 50), `apiKey`,
`traceToFile` (off; writes one line per menu, which hook showed it and why it
did or did not get the Luma submenu, plus an init line with the hook and
feature state, to `%TEMP%\luma-explorer-actions-trace.log`).

## Unload

`Wh_ModUninit` posts `WM_CANCELMODE` to the owners of menus still open, waits
(up to 3 s) for the hook to return, then `luma::Shutdown()`.

## Limits

- Classic menu only; the Windows 11 modern menu is untouched.
- File dialogs are other processes and are not hooked.
- Files whose menu has no default verb get no submenu.
- CWM_GETISHELLBROWSER is undocumented (long-standing; used by Open-Shell and
  other shell tools).
