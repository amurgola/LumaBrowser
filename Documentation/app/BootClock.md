# BootClock

`app/BootClock.js`

Boot timing diagnostics: one epoch, logged as `[luma-boot +Xms] main: <label>`.

## Methods

- `new BootClock({ now?, log?, globalObject? })` records the epoch and parks it
  on `global.__LUMA_BOOT_START`, which the shell preload reads so main and
  renderer lines share an origin.
- `log(label)`, `elapsed()`, `start` (the epoch).
