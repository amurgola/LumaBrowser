# MdnsInstancePool

`core/network-sharing/MdnsInstancePool.js`

Keeps one Bonjour instance per LAN interface, shared by advertising and
browsing.

## Methods

- `new MdnsInstancePool({ loadBonjour })`; `loadBonjour` returns the Bonjour
  constructor (default: `require('bonjour-service')`), injectable for tests.
- `isAvailable()` loads the constructor once; a load failure is remembered and
  warned about once.
- `currentInstances()` returns instances for the current interface set,
  creating missing ones. With no usable interface it returns one unpinned
  fallback instance.
- `destroy()` destroys and forgets every instance.

## Why

A single mDNS socket multicasts out one interface, whichever the OS routing
table picks. On Windows with WSL, Hyper-V or VPN adapters that is often a
virtual switch that never reaches the LAN. So each NIC gets its own instance,
bound to `0.0.0.0` (multicast receive works on every platform) with group
membership and outgoing interface pinned to that NIC.

Instances for vanished interfaces stay pooled (an advert may still be
published on them) but are not returned. Socket errors (EACCES, EADDRINUSE)
only warn; unhandled they would be uncaught exceptions.
