# MdnsAdvertisement

`core/network-sharing/MdnsAdvertisement.js`

Advertises this sharing host on every LAN interface.

## Methods

- `new MdnsAdvertisement(pool, { serviceType, name, port, txt })`. Name
  defaults to `LumaBrowser` (capped at 63 chars), port to 3000.
- `start()` publishes on every pooled instance and rechecks the interface set
  every 30 s, republishing when it changed. A no-op when discovery is
  unavailable. Returns `this`.
- `stop()` stops the timer and withdraws every published service.

## Why

Republishing on interface change means a NIC that appears after sharing was
enabled (late Wi-Fi, VPN) still advertises. Records are published with
`probe: false`: sibling per-NIC instances on the same machine would answer the
conflict probe over multicast loopback and force a bogus rename, and the TXT
`id` is the real identity anyway.
