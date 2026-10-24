# TaskbarIcons

`extensions/desktop-integration/features/jobs/TaskbarIcons.js`

Draws the jobs feature's 16x16 icons in code, so the feature ships no image
files: `running` (accent dot) and `failed` (red dot) for the taskbar overlay,
`stop` (white square) and `cancel` (white cross) for thumbnail toolbar
buttons.

- `new TaskbarIcons(nativeImage)`; `get(name)` -> a cached NativeImage from
  `nativeImage.createFromBitmap`, or null when `nativeImage` is unavailable.
- `TaskbarIcons.bitmap(name)` -> the premultiplied BGRA `Buffer` (4x4
  supersampled edges), or null for an unknown name.
