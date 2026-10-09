# ArtifactChips

`core/llm-server/ui/js/chat/turns/ArtifactChips.js`

A turn's artifacts: images and video as inline thumbnails (a sized skeleton
until the bytes land; video autoplays muted like a GIF, an image fallback swaps
in), audio as an inline player, live modules mounted inline
([LiveArtifacts](LiveArtifacts.md)), anything else a chip opening the panel.
One entry per artifact id.

## Methods

- `create(message)`, `ArtifactChips.signature(message)`.
- `userImages(message)`: a user turn's thumbnails.
- `ArtifactChips.liveImageThumb(dataUrl, name)`.
