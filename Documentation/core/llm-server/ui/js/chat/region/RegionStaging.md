# RegionStaging

`core/llm-server/ui/js/chat/region/RegionStaging.js`

Stages the areas a user marks for editing: on an image already in the
conversation (a chip of its own naming the artifact) or on an image still in
the composer (kept on that attachment as `region`), the chips the strip shows
for them, and the send when the editor's Edit now was used. The chat's
`regions` component.

## Methods

- `markArtifact({ id, title })`: loads the bytes through the
  [MediaArtifactCache](../panel/MediaArtifactCache.md), opens the
  [RegionEditor](RegionEditor.md) (continuing the chip already staged for that
  artifact, if any) and stages `{ kind: 'region', artifactId, title, name:
  'Area · <title>', mask, note, coverage, width, height, preview }`; one chip
  per artifact, a second marking replaces the first, a cleared one removes it.
- `edit(index)`: the attachment at `index`: a staged image gets or changes its
  `region`; a region chip reopens on its image.
- After either: a result with `send: true` (Edit now) submits the turn through
  `sender.submit(composer.text())`, so the chip, anything else staged and any
  typed text go out as the composer stands; otherwise the caret goes to the
  composer (Add to message).
- `RegionStaging.chip(artifact, result)`, `RegionStaging.region(result)`.
- `RegionStaging.chipHtml(f, i)`: the strip's region chip (preview thumbnail
  and hover preview, brush icon, name, share, change and remove buttons).
- `RegionStaging.imageButtonHtml(f, i)`: the brush on an image chip, lit
  (`has-region`) once the image has a region.
- `RegionStaging.describe(f)`, `RegionStaging.share(coverage)`.

Without a canvas (`RegionEditor.supported()` false) every entry point alerts
`UNSUPPORTED` and changes nothing.

## Why

A region is staged like any attachment, so it rides the same send, shows in the
same strip and is removed the same way; what the model gets is the catalog's
"marked region" line and `edit_image`'s `regionId`. Edit now reuses that send
rather than a path of its own, so the sent turn, the recorded region and the
reload all look the same whichever button closed the editor.
