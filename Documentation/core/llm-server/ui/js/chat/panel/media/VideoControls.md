# VideoControls

`core/llm-server/ui/js/chat/panel/media/VideoControls.js`

The viewer's video transport, in place of the browser's own controls (they
would fight the stage's drag to pan): play / pause, a scrub bar with the time,
single frame steps at the clip's recorded fps (24 when unknown), playback speed
(0.25x to 2x), loop and mute. Hidden for an image.

## Methods

- `element`, `attach(video, fps)` (`null` hides it).
- `togglePlay()`, `stepFrame(dir)` (pauses first).
- `VideoControls.formatTime(sec)`: `m:ss.s`.
