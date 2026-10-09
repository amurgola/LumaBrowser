# PeerAddress

`core/network-sharing/client/PeerAddress.js`

Turns what a user typed, or what mDNS advertised, into a reachable peer address.

## Methods

- `PeerAddress.baseUrl(address, defaultPort = 3000)` returns `scheme://host[:port]`
  or `null`. A bare host (`1.2.3.4`, `1.2.3.4:8080`) is `http` and gets the
  sharing port when none is typed. A URL with an explicit scheme keeps that
  scheme's default port, so `https://ai.example.com` pairs against a public
  HTTPS reverse proxy.
- `PeerAddress.pick(addresses, interfaces = os.networkInterfaces())` picks an
  IPv4 address: one on a subnet this machine shares, else an RFC1918 one, else
  the first. IPv6 is ignored; `null` when no IPv4 is offered.

## Why

A host advertises an A record for every interface, including virtual adapters
(WSL, Hyper-V, VPN) that nobody else can reach. Taking the first one used to
hand out dead 172.x addresses. `interfaces` is injectable so the preference
order is testable without patching `os`.
