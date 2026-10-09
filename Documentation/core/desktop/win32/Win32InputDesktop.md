# Win32InputDesktop

`core/desktop/win32/Win32InputDesktop.js`

Names the desktop that currently receives user input.

## Methods

- `Win32InputDesktop.name()` `"Default"` in normal use; `"Winlogon"` while a UAC
  prompt (secure desktop), the lock screen or the Ctrl+Alt+Del screen is up.
  A normal-integrity process may not open the Winlogon desktop, so a failed open
  returns null, which means the same thing. SendInput cannot reach that desktop
  either way, so DesktopService reports HUMAN_NEEDED.
