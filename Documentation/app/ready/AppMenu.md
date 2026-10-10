# AppMenu

`app/ready/AppMenu.js`

The application menu.

## Methods

- `AppMenu.apply(Menu, platform?, log?, app?)`: `null` on Windows and Linux, so
  Electron's built-in accelerators (Ctrl+W closing the window, Ctrl+R reloading
  the shell, F11) stay dead and browser shortcuts are matched per tab; on macOS
  `AppMenu.MAC_TEMPLATE` (`appMenu`, `editMenu`, `windowMenu`) so copy, paste
  and Quit work. A failure warns `[main] setApplicationMenu failed:`.

When given an unpackaged macOS app, configures the native About window with
"LumaBrowser Dev", the application version, and "Unofficial development build".
Packaged builds retain their existing About metadata. This does not change
Electron's internal app name or profile paths.
