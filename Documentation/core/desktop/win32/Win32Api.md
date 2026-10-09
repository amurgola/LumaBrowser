# Win32Api

`core/desktop/win32/Win32Api.js`

Binds the Windows functions desktop control calls through koffi (already
shipped for RAM pinning, so no native build), once per process.

## Methods

- `Win32Api.load()` the function table, cached. Throws
  `win32 bindings are Windows-only` off Windows. Table: `koffi`, `WNDENUMPROC`,
  and user32 / gdi32 / kernel32 / dwmapi / advapi32 functions for windows,
  input, capture and processes, all `__stdcall`.
- `Win32Api.loadDesktop()` `OpenInputDesktop`, `CloseDesktop`,
  `GetUserObjectInformationW`, bound separately on first use.

## Why intptr_t and raw Buffers

Every handle is `intptr_t`, so it comes back as a plain number: the same HWND
value Chromium puts in desktopCapturer ids `window:<hwnd>:0`. Structs are passed
as raw Buffers with explicit offsets by the callers instead of koffi struct
definitions: the layouts are small, fixed and documented, and a Buffer cannot be
mis-marshalled by a union or padding rule.
