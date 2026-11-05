# SharingPeersList

`ui/shell/settings/sharing/SharingPeersList.js`

Already-paired peers: enable, attach GPUs, refresh, remove; follows `sharing:peers-changed`.

## Methods

- `install()`, `load()`.
- `capabilities(p)` (`'2 LLMs, image-gen, image-edit, video-gen, 1 GPU (busy)'`), `rowHtml(p)` (static).

## Globals

Reads `window.sharingAPI` (injected).
