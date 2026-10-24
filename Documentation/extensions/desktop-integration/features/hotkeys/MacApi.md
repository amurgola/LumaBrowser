# MacApi

`extensions/desktop-integration/features/hotkeys/MacApi.js`

The macOS calls behind [MacKeys](MacKeys.md), bound once through koffi (already
shipped, so no native build): CoreGraphics `CGEventSourceFlagsState`,
`CGEventCreateKeyboardEvent`, `CGEventSetFlags`, `CGEventPost` (HID tap),
CoreFoundation `CFRelease`, and the Objective-C runtime (`objc_getClass`,
`sel_registerName`, `objc_msgSend` declared once per exact signature, never
variadic, because arm64 passes variadic arguments differently). AppKit is loaded
so NSPasteboard, NSWorkspace and NSRunningApplication resolve.

- `MacApi.load()` -> `{ flagsState(), postKey(keyCode, down, flags),
  changeCount(), frontmostPid(), activate(pid), appName(pid) }`. Throws off
  macOS.
