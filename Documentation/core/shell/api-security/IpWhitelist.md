# IpWhitelist

`core/shell/api-security/IpWhitelist.js`

The address list for [ApiSecurity](../ApiSecurity.md)'s `whitelist` network mode.

## Methods

- `new IpWhitelist(entries)` builds a `net.BlockList` from IPs and CIDR ranges
  of either family. Entries are trimmed; invalid ones are skipped silently.
- `list.matches(ip)` is true when the peer is listed. Non-addresses are `false`
  and never throw.
- `IpWhitelist.isValidEntry(entry)` validates one already-trimmed entry: an
  address, or `addr/prefix` with prefix 0..32 (IPv4) or 0..128 (IPv6).

## Why entries are normalized first

Dual-stack sockets report `::ffff:10.0.0.5` and the request side strips it to
`10.0.0.5` (see [IpClass](../../shared/net/IpClass.md)). Entries get the same
normalization, so `::ffff:10.0.0.0/24` is stored as an IPv4 /24 and its prefix
is bounded at /32, not silently accepted as a /120. Before this, a mapped CIDR
was added as IPv6 and could never match.
