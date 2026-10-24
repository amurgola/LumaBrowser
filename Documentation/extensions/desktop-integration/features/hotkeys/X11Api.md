# X11Api

`extensions/desktop-integration/features/hotkeys/X11Api.js`

The X11 calls behind [LinuxKeys](LinuxKeys.md), bound once through koffi from
`libX11.so.6` and `libXtst.so.6`, on one display opened at first use:
`XQueryKeymap`, `XKeysymToKeycode` (per call, so the keyboard layout decides
which key is "c"), `XGetInputFocus`, `XSetInputFocus` + `XRaiseWindow`,
`XFlush`, `XTestFakeKeyEvent`.

- `X11Api.load()` -> `{ keycode(keysymName), keysDown() -> (keycode) => bool,
  key(keycode, down), flush(), focusedWindow(), focus(window) }`. Throws off
  Linux or without a display.
- `KEYSYMS`: the modifier keysyms and `c`, `v`.
