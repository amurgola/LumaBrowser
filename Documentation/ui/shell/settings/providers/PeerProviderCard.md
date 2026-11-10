# PeerProviderCard

`ui/shell/settings/providers/PeerProviderCard.js`

Card of a paired peer: model choice persists; Refresh and Remove go through the sharing client.

## Methods

- `PeerProviderCard.build(config, peer, ctx)`, `html(config, peer)`, `parts(config, peer)` (for [ProviderCardShell](ProviderCardShell.md); the summary is the folded row's line), `summary(config, peer)` (lists image generation, image editor and video generation when the peer shares them).

## Globals

Reads `window.sharingAPI`.
