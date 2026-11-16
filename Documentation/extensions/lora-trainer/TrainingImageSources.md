# TrainingImageSources

`extensions/lora-trainer/TrainingImageSources.js`

Collects the pictures a request points at.

## Methods

- `collect({ artifactIds, paths, folder }, limit)` -> `{ images: [{ source, bytes, ext }], skipped: [{ source, reason }] }`.
  Chat artifacts are read through the host by id; a folder contributes its own picture
  files in name order (sub-folders are not walked).
- `TrainingImageSources.extOf(bytes)`: `png` or `jpg` from the first bytes, else null.

## Why

ai-toolkit reads only PNG and JPEG, so anything else (WebP included) is skipped with a
reason rather than failing inside the trainer. The format is read from the bytes because
a file extension can lie.
