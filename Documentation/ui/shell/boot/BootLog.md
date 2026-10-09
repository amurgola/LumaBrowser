# BootLog

`ui/shell/boot/BootLog.js`

Boot timing lines (`[luma-boot +Nms] renderer: ...`) offset from main's epoch, which MainWindow forwards to main's terminal.

## Methods

- `BootLog.log(label)`.
- `BootLog.origin()` main's epoch (`window.__LUMA_BOOT_START`) or the first call time.

## Globals

Reads `window.__LUMA_BOOT_START`.
