# NetworkDiscovery

`core/network-sharing/NetworkDiscovery.js`

mDNS discovery for Network Sharing: advertises the host as
`_lumabrowser._tcp` and browses for peers. Static facade over one process-wide
[MdnsInstancePool](MdnsInstancePool.md).

## Methods

- `NetworkDiscovery.isAvailable()` is false when `bonjour-service` cannot load.
- `NetworkDiscovery.advertise({ name, port, txt })` returns a started
  [MdnsAdvertisement](MdnsAdvertisement.md) (call `.stop()`).
- `NetworkDiscovery.browse({ onUp, onDown })` returns a started
  [MdnsBrowser](MdnsBrowser.md) (`.stop()`, `.list()`).
- `NetworkDiscovery.destroy()` closes every pooled Bonjour instance.
- `NetworkDiscovery.SERVICE_TYPE` is `'lumabrowser'`.

## Why

The whole feature degrades gracefully: without `bonjour-service`, advertise and
browse become harmless no-ops and the manual add-by-IP path still works.

The pool is process-wide because the host (advertise) and the client (browse)
share the same per-interface sockets, as they did in legacy.
