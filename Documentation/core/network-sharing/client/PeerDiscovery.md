# PeerDiscovery

`core/network-sharing/client/PeerDiscovery.js`

Browses mDNS for sharing hosts and keeps the ones currently up, minus this machine.

## Methods

- `new PeerDiscovery({ getSelfId, browse })`; `browse` defaults to
  [NetworkDiscovery](../NetworkDiscovery.md)`.browse`.
- `start()` idempotent; reads the self id once and starts browsing.
- `stop()` stops the browser.
- `list(knownIds = new Set())` the hosts seen, without ids in `knownIds`:
  `{ id, name, address, port, endpoint: 'http://<address>:<port>' | null, txt, fromMdns: true }`.
- `PeerDiscovery.idOf(service)` is `txt.id`, else `fqdn`, else `name`.

The address is `PeerAddress.pick(service.addresses)`, falling back to the mDNS host name.
