# RunImages

`core/llm-server/chat/bridge/turn/RunImages.js`

The images that ride on a run's completions, each exactly once.

## Methods

- `new RunImages(images)`, `count`.
- `forCompletion()`: the attachments on the first call only, plus a queued
  screenshot (then cleared).
- `queueToolImage(image)`: the latest screenshot wins.
