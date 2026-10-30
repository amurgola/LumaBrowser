# MediaManuals

`core/llm-server/chat/tool-groups/MediaManuals.js`

Data only: the full prose manuals for the media tool groups.

## Members

- `MediaManuals.IMAGE`: `generate_image` and `edit_image` (frames, which on
  an edit model extend the picture around the kept source, placed by
  `anchor`; strength buckets, references, marked regions and `regionId`,
  undoing a bad edit) plus how to prompt the local image model.
- `MediaManuals.VIDEO`: `generate_video` and `animate_image`, `durationSec`
  (max 15).
- `MediaManuals.MUSIC`: `generate_music`, lyric tags, style description,
  `durationSec` (max 300).
