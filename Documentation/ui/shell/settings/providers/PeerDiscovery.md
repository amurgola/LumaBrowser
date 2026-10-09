# PeerDiscovery

`ui/shell/settings/providers/PeerDiscovery.js`

Discovered-hosts list of the peer form, refreshed every 2.5 s while in peer mode.

## Methods

- `install()`, `start()`, `stop()`, `clear()`, `refresh()`.
- `address(addr, port)`, `html(found)` (static).

## Globals

Reads `window.sharingAPI.startDiscovery`, `getDiscovered`.
