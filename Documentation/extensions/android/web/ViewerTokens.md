# ViewerTokens

`extensions/android/web/ViewerTokens.js`

Short-lived, single-use tickets for the device page's video socket.

## Methods

- `issue(deviceName)` -> a ticket good for 30 s; `redeem(token)` -> the device, once, or null.

## Why

A WebSocket upgrade passes none of the gateway's checks and a browser cannot put a header on one, so the page asks a guarded route for a ticket first.
