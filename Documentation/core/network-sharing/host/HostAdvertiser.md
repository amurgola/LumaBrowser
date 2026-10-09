# HostAdvertiser

`core/network-sharing/host/HostAdvertiser.js`

Advertises the sharing host over mDNS while sharing is enabled.

## Methods

- `new HostAdvertiser({ discovery = NetworkDiscovery })`: `discovery` is
  injectable for tests ([NetworkDiscovery](../NetworkDiscovery.md) shape).
- `start({ name, port, instanceId, proto, tlsPort })`: stops any running advert,
  then advertises with TXT `{ id, requiresPin: '1', api: '/api/sharing', proto,
  tlsPort }` (strings). A failure only warns.
- `stop()`: stops the advert; errors swallowed.
- `isAvailable()`: whether mDNS works on this machine.

## Why

Restarting on every call keeps the advert fresh after a rename or TLS port
change. The TXT record carries nothing secret.
