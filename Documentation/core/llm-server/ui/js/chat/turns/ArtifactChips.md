# ArtifactChips

`core/llm-server/ui/js/chat/turns/ArtifactChips.js`

A turn's artifacts: images and video as inline thumbnails (a sized skeleton
until the bytes land; video autoplays muted like a GIF, an image fallback swaps
in), audio as an inline player, live modules mounted inline
([LiveArtifacts](LiveArtifacts.md)), anything else a chip opening the panel.
One entry per artifact id. An image thumbnail sits in a `.cm-art-thumb-box`
beside a `.cm-art-mark` brush (shown on hover or focus) that opens the region
editor on it (`ctx.regions.markArtifact`); the thumbnail is a button itself,
so the brush is a sibling rather than a child.

## Methods

- `create(message)`, `ArtifactChips.signature(message)`.
- `userImages(message)`: a user turn's thumbnails; a live image gets its brush
  once the meta event paired it with its artifact (same count, by position).
- `ArtifactChips.liveImageThumb(dataUrl, name)`.
