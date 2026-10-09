# OriginPolicy

`core/network-sharing/OriginPolicy.js`

Decides whether a caller may reach the Network Sharing host surfaces (the
`/sharing` API and the web backend).

## Methods

- `OriginPolicy.originAllowed(bindMode, req)`: `'any'` admits every caller.
  Every other value, including `'lan'`, unknown and missing, admits only
  on-network peers: `IpClass.isLanPeer(IpClass.clientIp(req))` (loopback,
  RFC1918, link-local, IPv6 ULA and link-local, CGNAT 100.64/10).
- `OriginPolicy.MODE_ANY`, `OriginPolicy.MODE_LAN`.

## Why

The range tables are shared with the REST gateway's ApiSecurity through
[IpClass](../shared/net/IpClass.md); they used to be copies that had drifted.
The mode knob stays separate so the sharing surface can be opened without
opening the REST API. Unknown modes fail closed to `lan`.
