# Win32Process

`core/desktop/win32/Win32Process.js`

Executable path and elevation of a window's process. Opens processes with
`PROCESS_QUERY_LIMITED_INFORMATION` only, and closes every handle it opens.

## Methods

- `Win32Process.imagePath(pid)` the full image path, or null.
- `Win32Process.isElevated(pid)` true / false, or null when it cannot tell.
  A denied token, for a medium-integrity caller, itself suggests elevation or
  protection, so DesktopService treats null with suspicion.

## Why elevation matters

Windows UIPI silently drops input a medium-integrity app sends to an elevated
one, so a click would "succeed" and do nothing. Desktop control refuses those
windows instead. (Anti-cheat detection deliberately never opens the game
process; see AntiCheatDetector.)
