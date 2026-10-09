# RpcBindAddress

`core/network-sharing/host/rpc/RpcBindAddress.js`

Chooses the single address the unauthenticated rpc-server binds to. Security
sensitive: see [RpcLendingService](../RpcLendingService.md#security).

## Methods

- `RpcBindAddress.choose(candidate, interfaces = os.networkInterfaces())`:
  - `candidate` (the consumer's `req.socket.localAddress`) with a `::ffff:`
    prefix stripped, when it is a dotted quad other than `127.0.0.1` and `0.0.0.0`;
  - else the first non-internal IPv4 interface address that
    [IpClass](../../../shared/net/IpClass.md) classifies `private` (10/8,
    172.16/12, 192.168/16);
  - else null, and the lend is refused.

## Why

The RPC protocol has no authentication, so the listener is never wider than the
one address the consumer reached us on. A missing or loopback local address
(tests, proxied setups) falls back to a private LAN address, never to a public
address or a wildcard.
