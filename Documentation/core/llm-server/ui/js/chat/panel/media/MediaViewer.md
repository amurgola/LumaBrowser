# MediaViewer

`core/llm-server/ui/js/chat/panel/media/MediaViewer.js`

The artifact panel's image and video viewer (`data-layout="media"`). It renders
straight into the panel, not the sandboxed frame, so it owns the wheel and the
pointer:

- Stage: wheel or trackpad pinch zooms about the pointer, drag pans a zoomed
  picture (clamped to it), double click flips between fit and 1:1 (twice the
  fit for an image already shown at its own size). Arrows at the stage's sides
  move to the previous / next item. A press without a drag on a video plays or
  pauses it. Zoom maths: [MediaViewport](MediaViewport.md).
- Toolbar: "3 of 12", zoom out / percent / zoom in, Fit, 1:1, the
  [VideoControls](VideoControls.md) transport for a video, a light
  (checkerboard) or dark backdrop and the details toggle. The backdrop and
  whether details are open persist in `localStorage`
  (`luma.chat.viewerBackdrop`, `luma.chat.viewerDetails`).
- Details strip ([MediaDetails](MediaDetails.md)): the prompt (three lines,
  click to expand), the render meta chips and the actions: Copy prompt, Copy
  image (PNG on the clipboard, other formats redrawn through a canvas),
  Download (the panel's), Mark area (`ctx.regions.markArtifact`), Use as
  reference (stages the image as a composer attachment) and Make another
  (pre-fills the reply box, never sends).
- Filmstrip: the conversation's media ([MediaGallery](MediaGallery.md)) as
  64 px thumbnails, the current one outlined and scrolled into view; hidden
  for a single item. Neighbours preload through the
  [MediaArtifactCache](../MediaArtifactCache.md) so stepping is instant, and a
  cached item swaps in without the loading line.

Keys while it shows (never while typing in a field): Left / Right previous /
next, + / - zoom, 0 fit, 1 actual pixels, I details, B backdrop; for a video
Space play / pause and comma / period a frame back / forward. The panel adds F
for theater and Escape to leave it.

## Methods

- `element()`: the root, built once.
- `open(artifact)`: shows it within the conversation's gallery.
- `show(index)`, `next()`, `prev()` (wrap around).
- `current()`, `currentEntry()`.
- `reset()`: pauses and drops the media (panel closed or switched type).
- `focus()`, `relayout()`, `onKey(event)` (true when consumed),
  `toggleDetails()`.

Hooks: `onShow(item, entry)` (entry null while loading) so the panel retitles
and re-enables its buttons; `onDownload()`.
