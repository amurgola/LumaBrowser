# RunImages

`core/llm-server/chat/bridge/turn/RunImages.js`

The images that ride on a run's completions, each exactly once.

## Methods

- `new RunImages(images)`, `count`.
- `forCompletion()`: the attachments on the first call only, plus a queued
  screenshot (then cleared).
- `returnUndelivered()`: the completion the last hand-out rode on failed, so
  the same images ride the next `forCompletion()`. A screenshot queued since
  the hand-out is newer and stays. A second call, or a call with nothing
  handed out, changes nothing.
- `queueToolImage(image)`: the latest screenshot wins.

## Changes (2026-11-26, a failed completion keeps its images)

"Exactly once" used to mean once handed out, delivered or not.
[CompletionDriver](CompletionDriver.md) now calls `returnUndelivered()` when a
completion resolves `{ success: false }`. Before that, the agent loop's retry
of a failed first request (`CompletionSender.sendFirst`, or an overflow
recovery) went out as text alone while the system prompt still carried the
[VisionHint](../prompt/VisionHint.md) line saying the picture was visible.
Seen live with a paired host whose model server ran without image input: the
host refused the first request (HTTP 400), the retry reached it without the
photo, and the model described a picture it never saw, built from words
elsewhere in the prompt (the user's custom tool descriptions).
