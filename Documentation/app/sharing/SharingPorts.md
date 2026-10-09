# SharingPorts

`app/sharing/SharingPorts.js`

The inbound ports Network Sharing needs open where the firewall is per port
(Linux ufw): the REST gateway, the TLS peer listener, the web backend and every
port of the GPU-lend RPC range. Windows and macOS use a per-program rule.

## Methods

- `new SharingPorts({ getApiPort, hostService, rpcLending })`.
- `list()` the ports, dropping anything that is not a positive integer.
- `getter()` the `getPorts` function [SharingIpcHandlers](../../core/network-sharing/SharingIpcHandlers.md) takes.
