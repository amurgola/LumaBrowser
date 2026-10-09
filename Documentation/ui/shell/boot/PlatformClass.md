# PlatformClass

`ui/shell/boot/PlatformClass.js`

Adds `platform-darwin|linux|win32|other` to `<body>` so CSS follows each OS's window chrome (Linux rounds its corners in CSS).

## Methods

- `PlatformClass.detect(platform)`.
- `PlatformClass.apply(body?, platform?)`.

## Globals

Reads `navigator.platform`.
