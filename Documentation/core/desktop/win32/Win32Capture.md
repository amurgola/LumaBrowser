# Win32Capture

`core/desktop/win32/Win32Capture.js`

Captures pixels as top-down BGRA.

## Methods

- `Win32Capture.captureBGRA({ hwnd = 0, rect })` `{ width, height, bgra }`.
  With a window: `PrintWindow(PW_RENDERFULLCONTENT)` into a bitmap the window's
  size, which works for occluded and GPU-composited windows. With hwnd 0: BitBlt
  of the screen rectangle (what is actually on screen), with CAPTUREBLT.
  Throws `capture: empty rectangle`, `PrintWindow failed`, `BitBlt failed` or
  `GetDIBits failed`; every GDI object is freed either way.
- `Win32Capture.isBlank(bgra)` true when the frame is uniformly black, which is
  how PrintWindow fails for many Direct3D windows (DesktopService then captures
  the screen region instead). Samples every 97th pixel.
- `Win32Capture.bitmapInfo(width, height)` the 32 bpp top-down BITMAPINFO.
