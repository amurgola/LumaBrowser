# Win32ScanCodes

`core/desktop/win32/Win32ScanCodes.js`

Hardware scan codes for virtual keys. Games that read DirectInput / Raw Input
look only at the scan code and ignore wVk, so VK-only input never reaches them.

## Methods

- `Win32ScanCodes.scanCodeFor(vk)` `{ scan, extended }`, or null when unknown.
  Asks the user's current layout (`MapVirtualKeyW`, `MAPVK_VK_TO_VSC_EX`) and
  falls back to `US_SCAN` when that fails (not Windows) or returns 0.
- `Win32ScanCodes.US_SCAN` US set-1 codes; values at or above 0xE000 carry the
  extended prefix.

## Why the VK decides "extended"

`VSC_EX` is documented to put the 0xE0 / 0xE1 prefix in the high byte, but on
Windows 10 LTSC it returned a bare 0x48 for VK_UP (the numpad-8 code). So a key
is extended when the prefix says so or its VK is in `DesktopKeys.EXTENDED`;
without the flag an arrow arrives as a numpad key.
