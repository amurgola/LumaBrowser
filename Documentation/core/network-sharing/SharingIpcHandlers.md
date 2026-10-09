# SharingIpcHandlers

`core/network-sharing/SharingIpcHandlers.js`

IPC controller for the Network Sharing settings panel and the LLM tab's Share
flyout. Every handler is raw: it returns the service's reply as is (lists stay
arrays, getters stay plain objects), and a throw rejects the invoke.

## Methods

- `new SharingIpcHandlers({ hostService, clientService, getPorts })`;
  `getPorts()` returns the inbound ports Linux ufw should open (default `[]`).
- `register()` registers:
  - Host settings. `core.sharing.host.getConfig` -> `getConfig()`. Each setter
    replies `{ ...setterResult, config: getConfig() }`: `setEnabled`, `setPin`,
    `clearPin`, `setInstanceName`, `setBindMode`, `setWebEnabled`,
    `setWebPort`, `setTlsPort`, `setWebAllowedTools`, `setShareFlag(flag, value)`,
    `setWebPublicUrl` (all `core.sharing.host.<name>`).
  - Firewall. `core.sharing.host.firewall.getStatus` -> `Firewall.detect()`;
    `core.sharing.host.firewall.allow` -> `Firewall.ensureAllowed({ exePath:
    process.execPath, appPath: process.execPath, ports: getPorts() })`.
  - Share links. `core.sharing.shareLink.status|create(args)|list|revoke(id)|revokeAll`
    -> `getShareLinkStatus`, `createShareLink(args || {})`, `listShareLinks`,
    `revokeShareLink`, `revokeAllShareLinks`.
  - Paired-client tokens. `core.sharing.host.listTokens|revokeToken(id)|removeToken(id)|revokeAllTokens`.
  - Client. `core.sharing.client.listPeers`, `probe(address, port)`,
    `pair(address, pin, port)` -> `pair(address, pin, { port })`,
    `refreshPeer(id)`, `setPeerEnabled(id, enabled)`,
    `setPeerGpusAttached(id, attached)`, `removePeer(id)`, `getDiscovered`,
    `startDiscovery` and `stopDiscovery` (both reply `{ success: true }`).
