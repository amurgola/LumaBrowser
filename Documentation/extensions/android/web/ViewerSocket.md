# ViewerSocket

`extensions/android/web/ViewerSocket.js`

Controller for the device page's video socket (`/api/ext/android/ws`).

## Methods

- `handleUpgrade(request, socket, head)`: admits a request whose ticket redeems and whose `Origin`, when present, is the request's own host; anything else has its socket destroyed. Then opens the device (the page is told `starting`, or `failed` with the reason) and attaches a [DeviceViewer](DeviceViewer.md). Messages from the page are capped at 64 KB.
