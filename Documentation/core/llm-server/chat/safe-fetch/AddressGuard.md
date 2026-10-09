# AddressGuard

`core/llm-server/chat/safe-fetch/AddressGuard.js`

Decides whether [SafeFetch](../SafeFetch.md) may open a socket to an address,
and supplies the connect-time DNS lookup that enforces it.

## Methods

- `AddressGuard.isBlockedAddress(ip)`: true unless
  `IpClass.isConnectableTarget(AddressGuard.canonical(ip))`. Non-IP input is blocked.
- `AddressGuard.isBlockedIPv4(ip)` / `isBlockedIPv6(ip)`: also blocked when the
  input is not that family.
- `AddressGuard.canonical(ip)`: IPv6 compressed and lowercased, with an
  IPv4-mapped address in any spelling (`::ffff:7f00:1`,
  `0:0:0:0:0:ffff:7f00:1`) turned into its dotted quad. Other input unchanged.
- `AddressGuard.literalRefusal(hostname)`: for a URL hostname that is an IP
  literal (brackets allowed) and blocked, the message
  `blocked non-public address <ip> for <hostname>`; otherwise `null`.
- `AddressGuard.isRefusal(errorText)`: true for this guard's refusal text as
  SafeFetch reports it (`REFUSAL_PATTERN`). PageClassifier.tabMightSucceed uses it so
  a refused address is never retried in a browser tab, which has no SSRF guard.
- `AddressGuard.lookup(hostname, options, callback)`: a `dns.lookup` drop-in
  for `http(s).request`. It honours `{ all: true }` (Node's http stack asks for
  the array shape) and fails with the error above if any candidate is blocked.

## Why

The range table lives in [IpClass](../../../shared/net/IpClass.md); the deny
polarity is here: anything not classified `public` is refused. That is
strictly stricter than the inbound `isLanPeer` allow-list.

Checking at connect time on the address the socket will use closes the
DNS-rebinding gap. Node's TLS still uses the hostname for SNI and certificate
checks, so no manual SNI handling is needed.

`dns.lookup` is called at call time (not captured at load) so tests can mock it.
