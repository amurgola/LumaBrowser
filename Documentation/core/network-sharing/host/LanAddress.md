# LanAddress

`core/network-sharing/host/LanAddress.js`

Picks the IPv4 address other LAN devices can reach this machine on, for
building share-link URLs.

## Methods

- `LanAddress.pick(interfaces = os.networkInterfaces())`: among non-internal
  IPv4 addresses, the first private one ([IpClass](../../shared/net/IpClass.md)
  `'private'`: 10/8, 172.16/12, 192.168/16), else the first one, else
  `127.0.0.1`. A failing or empty interface list gives loopback.
