# routes

`extensions/android/routes.js`

REST routes entry of the Android add-on, mounted by core at `/api/ext/android` with the route context
(`extensionApi` from `activate`, `gateway`, `browser`).

## Exports

- A factory `(context) => Router`: [DeviceRoutes](web/DeviceRoutes.md)`.create(context)`, which serves the device
  page and its API and registers the video socket's upgrade.
