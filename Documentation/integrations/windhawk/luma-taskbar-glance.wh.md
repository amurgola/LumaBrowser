# luma-taskbar-glance

`integrations/windhawk/luma-taskbar-glance.wh.cpp`

A Windhawk mod (id `luma-taskbar-glance`, `@include explorer.exe`,
`@architecture x86-64`, `@compilerOptions -lwinhttp -lversion -lole32 -loleaut32 -lruntimeobject`)
that shows the [glance](../../extensions/desktop-integration/features/glance/index.md)
line on the Windows 11 taskbar clock and its details in the clock tooltip, and
opens Luma on a middle-click. GPL-3.0: the clock hooks are adapted from m417z's
Taskbar Clock Customization (windhawk-mods). Embeds
[luma_client](_shared/luma_client.inc.md) verbatim.

## How it works

- **Poll thread** (`PollThread`, its own thread, never a UI thread): every
  `refreshSeconds` (default 30), only in the explorer.exe that owns
  `Shell_TrayWnd`, it checks `luma::HasFeature("glance")`, calls
  `GET /api/desktop/glance/` with the blocking `luma::Get`, and stores `line`
  (control characters collapsed, clipped to `maxChars`) and `tooltip` (CRLF)
  under a mutex. Luma down or the feature off: after two failed polls in a row
  the line becomes `offlineText` (default empty = the stock clock). When the
  text changes it nudges the clock to redraw by writing and deleting a temp
  value under `HKCU\Control Panel\TimeDate\AdditionalClocks` (the clock's
  registry watcher; the same trick as Taskbar Clock Customization).
- **Clock text**: symbol hooks on SystemTray.dll (or Taskbar.View.dll before
  2604, or ExplorerExtensions.dll) `ClockSystemTrayIconDataModel(2)::RefreshIcon`
  set a thread-local flag; kernelbase `GetDateFormatEx` / `GetTimeFormatEx`
  hooks, only while that flag is set and outside the tooltip, return the
  cached line. `lineMode`: `replaceDate` (default), `appendDate` (date, a middle
  dot, the line), `thirdLine` (a newline after the date), `replaceTime`,
  `tooltipOnly`. An empty cached line means the stock text.
- **Tooltip**: hooks on the `GetTimeToolTipString` / `GetTimeToolTipString2`
  variants grow the returned heap hstring to add the glance tooltip
  (`tooltipMode`: `append`, `replace`, `off`). Skipped unless the string is a
  heap hstring with the expected layout.
- **Middle-click**: `DateTimeIconContent::OnApplyTemplate` and
  `BadgeIconContent::get_ViewModel` hooks (optional symbols) add a
  `PointerPressed` handler to each `SystemTray.DateTimeIconContent` element;
  a middle button press (only while Luma answers) calls
  `luma::AllowForeground()` and `POST /glance/open { target }` (`clickTarget`:
  `hub`, `event`, `thread`, `task`, `off`). Left clicks are untouched.
  No styles or properties are set on any XAML element.
- **Unload**: `Wh_ModBeforeUninit` stops the poll thread (stop event plus
  `luma::Shutdown()` to cancel a request in flight), removes the click
  handlers on each element's own UI thread (`Dispatcher().RunAsync`, 5 s
  wait), clears the text and nudges the clock back to stock;
  `Wh_ModUninit` calls `luma::Shutdown()` again and nudges once more with the
  hooks gone.

## Settings

`lineMode`, `refreshSeconds` (10 to 3600), `maxChars` (0 = no limit, max 200),
`offlineText`, `tooltipMode`, `clickTarget`, `apiKey`. What the line contains
(providers, separator, time format, Luma's own maximum) is set in Luma's
Glance feature settings.

## Limits

- Windows 11 22H2 or newer only (x86-64); Windows 10's clock is not hooked.
- The clock repaints about once a minute on its own; between nudges the line
  may lag a poll.
- Conflicts with Taskbar Clock Customization on the same clock line (both hook
  the same functions; the one that runs last wins).
- If a clock's UI thread does not answer within 5 s at unload, its click
  handler may stay attached to code that is being unloaded.
