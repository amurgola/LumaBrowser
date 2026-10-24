# AppUpdateJobSource

`extensions/desktop-integration/features/jobs/sources/AppUpdateJobSource.js`

The app's own update download. `core/shell/Updater.js` drives electron-updater's
`autoUpdater`; this source adds its own listeners (removed on `stop()`):

- `download-progress` `{ percent, total, transferred, bytesPerSecond }`: starts
  an `app-update` job ("Downloading LumaBrowser update") or moves it; `eta`
  from the remaining bytes and speed.
- `update-downloaded`: done ("Version x ready").
- `error`: failed, only while a download job is active (update checks that fail
  are not jobs).

Not cancellable: the Updater owns the download. `getUpdater` is a seam; the
feature loads `electron-updater` lazily and skips the source when it cannot.
