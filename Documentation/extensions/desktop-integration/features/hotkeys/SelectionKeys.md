# SelectionKeys

`extensions/desktop-integration/features/hotkeys/SelectionKeys.js`

Picks the keyboard and clipboard backend [SelectionClipboard](SelectionClipboard.md)
uses: [NativeKeys](NativeKeys.md) on Windows, [MacKeys](MacKeys.md) on macOS,
[LinuxKeys](LinuxKeys.md) on Linux. All share one interface (`supported`,
`heldModifiers`, `releaseKeys`, `clipboardSequence`, `foregroundWindow`,
`focusWindow`, `sendCombo('copy' | 'paste')`, plus the optional members
SelectionClipboard documents). Any other platform gets `UNSUPPORTED`, a backend
whose `supported` is false.

- `SelectionKeys.create({ platform?, clipboard? })`: `clipboard` is Electron's
  (LinuxKeys reads the primary selection through it).
