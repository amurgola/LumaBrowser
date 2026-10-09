# NetworkSharingPanel

`ui/shell/settings/sharing/NetworkSharingPanel.js`

Network Sharing host settings (enable, name, PIN, bind mode, share flags, web backend) composing the firewall, web tools, tokens and peers parts; reloads on open and warms mDNS discovery.

## Methods

- `install()`, `loadHost()`, `applyHostConfig(cfg)`.
- `SHARE_FLAGS`, `summary(cfg)`, `webHint(cfg)` (static).

## Globals

Reads `window.sharingAPI`.
