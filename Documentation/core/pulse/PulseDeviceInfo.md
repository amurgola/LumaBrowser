# PulseDeviceInfo

`core/pulse/PulseDeviceInfo.js`

The device facts the pulse reports.

## Methods

- `PulseDeviceInfo.appVersion()` is Electron's `app.getVersion()`, or `''`
  when unavailable.
- `PulseDeviceInfo.platform()` is `process.platform`, falling back to
  `os.platform()`, then `unknown`.
- `PulseDeviceInfo.userAgent(facts)` builds
  `LumaBrowser/<app> (<platform> <arch>; <osType> <osRelease>) Electron/<electron>`,
  for example `LumaBrowser/1.1.1 (darwin arm64; Darwin 23.6.0) Electron/34.0.0`.
  `facts` defaults to this process. Each field keeps only word characters,
  `.`, `-`, `+` and spaces, and is cut to 64 characters.

## Why

This User-Agent is sent only on `/api/pulse`; every other request keeps the
app-wide Chrome spoof. It stays ASCII-safe and short so it never trips the
server's VARCHAR(255) User-Agent columns or proxy header limits, and so a
crafted version string cannot inject a header.
