# SingleListener

`core/network-sharing/webapp/public/js/shim/SingleListener.js`

A one-subscriber event slot, the shape of the desktop's `onChatEvent` and
`onServerEvent`.

## Methods

- `on(cb)`: replaces the listener; returns an unsubscribe that clears it only if
  it is still current.
- `emit(event)`: calls the listener; its exceptions are swallowed.
