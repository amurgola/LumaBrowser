# NetworkSharingPanel

`ui/shell/settings/sharing/NetworkSharingPanel.js`

Network Sharing host settings (enable, name, PIN, bind mode, share flags, web backend) composing the firewall, web tools, tokens, users ([SharingUsersList](SharingUsersList.md)) and peers parts; reloads on open (and makes the users list read the permission catalog afresh) and warms mDNS discovery.

## Methods

- `install()`, `loadHost()`, `applyHostConfig(cfg)`.
- `SHARE_FLAGS` (flag name -> checkbox id, including `shareVideoGen` -> `gsShareVideoGen`), `summary(cfg)`, `webHint(cfg)` (static).

## Globals

Reads `window.sharingAPI`.
