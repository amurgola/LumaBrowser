# DemoClip

`tools/docs/readme-shots/DemoClip.js`

Records the app window while a scene plays and turns the recording into the README's animated demo. ffmpeg captures
the window itself through Windows.Graphics.Capture (its `gfxcapture` source), because a page screenshot cannot see
the tab strip and the active view together and the desktop capturer is too slow for video. A grab of the screen
rectangle was tried first and dropped: anything above the app (a touch keyboard, a notification) landed in the clip.

The raw recording is then sped up just enough to fit a time budget and written twice: a palette GIF (960 px wide,
10 frames a second) that GitHub shows inline from the repo, and an MP4 of the same cut for anyone who wants to
upload a video instead.

Needs `ffmpeg` 8 or newer and `ffprobe` on PATH and is Windows only. The window may be covered while it records,
but not minimized.

## Methods

- `static requireTools()`: throws with what to install when ffmpeg or ffprobe is missing or too old, or off
  Windows.
- `static start(hwnd, outPath)`: starts recording the window with that native handle (a decimal string) at 15
  frames a second; returns `{ stop() }`, and `stop()` resolves once the file is closed.
- `static render(rawPath, { gifPath, mp4Path, maxSeconds })`: writes the GIF and the MP4; returns
  `{ seconds, speed }`.
- `static speedFor(durationSec, maxSeconds)`: the playback speed that fits the budget, never under 1.
- `static recordArgs`, `gifArgs`, `mp4Args`: the ffmpeg command lines, kept apart so they can be tested.
- `static duration(path)`: seconds, through ffprobe.
