# GameKeyEvents

`core/games/GameKeyEvents.js`

The down and up SendInput records for one game key.

## Methods

- `GameKeyEvents.forKey(win, vk, mode)` `{ down, up }`. `mode 'scan'` (the
  default in GameController) sends scan codes with the extended flag where
  needed, via `win.scanCodeFor` and `win.keyInputScan`; throws
  `No scan code for virtual key 0x<vk> on this keyboard layout; try mode "vk".`
  `mode 'vk'` sends virtual keys via `win.keyInput`, extended for `DesktopKeys.EXTENDED`.
