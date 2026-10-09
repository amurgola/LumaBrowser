# LanInterfaces

`core/network-sharing/LanInterfaces.js`

Lists the machine's LAN-facing IPv4 addresses for mDNS.

## Methods

- `LanInterfaces.ipv4Addresses()` returns the first non-internal IPv4 address
  of each interface; `[]` if enumeration throws.
- `LanInterfaces.addressKey()` returns the sorted addresses joined by commas,
  compared over time to detect network changes cheaply.

## Why

Only one address per interface, because a socket can join the multicast group
once per NIC.
