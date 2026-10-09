# IpClass

`core/shared/net/IpClass.js`

One IP range taxonomy with two named trust predicates: inbound "is this caller
on my network" and outbound "may I open a socket to this".

## Methods

- `IpClass.classifyIp(ip)` returns `'loopback' | 'private' | 'link-local' |
  'cgnat' | 'multicast' | 'reserved' | 'public' | 'invalid'`. IPv4-mapped IPv6
  is classified as the IPv4 it carries.
- `IpClass.isLanPeer(ip)` (inbound allow-list) is true for loopback, private,
  link-local and CGNAT.
- `IpClass.isConnectableTarget(ip)` (outbound deny-list) is true for public only.
- `IpClass.isLoopbackIp(ip)` is true for loopback (the REST gateway's 'system' mode).
- `IpClass.normalizeIp(ip)` turns `::ffff:a.b.c.d` into `a.b.c.d`, and nullish
  into `''`. It does not trim.
- `IpClass.clientIp(req)` is the normalised `req.socket.remoteAddress`, or `''`.

## Why

Three copies of "is this address special" had drifted: ApiSecurity (who may
call /api), the network-sharing origin policy (who may reach the sharing
host), and safeFetch (where the web tool may connect). The first two are
allow-lists over inbound peers; the third is a strictly larger deny-list over
outbound targets. The two predicates are deliberately NOT complements:
collapsing `isConnectableTarget` onto `!isLanPeer` would let a DNS answer of
`::ffff:127.0.0.1` or a reserved/multicast address through (SSRF).

CGNAT counts as a LAN peer because Tailscale and carrier NAT put genuine peers
in 100.64/10. Only a canonical dotted quad is parsed: shorthand like `127.1`
never appears as a socket peer and is `'invalid'`. Input is not trimmed, so a
padded string can never classify differently from the raw one.

The mapped-form normaliser exists because dual-stack sockets report
`::ffff:10.0.0.5`; storing one form and comparing the other meant whitelist
entries never matched.
