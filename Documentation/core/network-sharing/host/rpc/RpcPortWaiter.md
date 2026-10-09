# RpcPortWaiter

`core/network-sharing/host/rpc/RpcPortWaiter.js`

Waits for a freshly spawned rpc-server to accept TCP connections.

## Methods

- `RpcPortWaiter.wait(host, port, timeoutMs, stillWanted = () => true)`
  resolves true on the first successful connect (2 s connect timeout per try,
  retried every 500 ms), false after `timeoutMs`, or false at once when
  `stillWanted()` turns false (the lease ended meanwhile).

## Why

A lend is only reported once the consumer can actually reach it; a closed host
firewall shows up here as a timeout.
