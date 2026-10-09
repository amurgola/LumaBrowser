# AutoSetupFlow

`core/llm-server/ui/js/wizard/AutoSetupFlow.js`

Automatic Local Setup inside Easy Setup. `render()` dispatches the view machine (`question`, `question-music`, `plan`, `progress`, `done`, `error`; anything else falls back to the first question) with a three-stage header and Back wired through `onclick`. `run()` drives [AutoSetup](../setup/AutoSetup.md) over the chat, image, music, placement and system APIs.

## Methods

- `render()`; `run()` (paused: PausedView with Resume; failed: error view with any missing system libraries; done: model name and per-leg outcome); `AutoSetupFlow.stageIndex(view)`.

## Globals

None.
