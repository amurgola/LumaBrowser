# ModelStatusNotifier

`app/events/ModelStatusNotifier.js`

Turns the model supervisors' `state-change` events into entries in the
renderer's notification log.

## Methods

- `new ModelStatusNotifier(notify)`; `notify(message, type)` is
  `AppContext#notifyModelStatus`.
- `watchAll(services)` watches the LLM server, speech-to-text, image generate,
  edit and video slots, music and grounding supervisors (kinds `LLM model`,
  `voice recognition model`, `image model`, `image-edit model`, `video model`,
  `music model`, `visual grounding model`). The fit tester's throwaway
  supervisor is never watched.
- `watch(server, kind)` false for a missing server.
- `ModelStatusNotifier.labelFor(server, kind)`: `<kind> "<plan.modelName or modelId>"`,
  else the kind.
- `ModelStatusNotifier.entryFor(event, label)`: `starting` -> `Loading <label>...`
  (info), `ready` -> `<label> ready` (success), `idle` -> `<label> unloaded`
  (info), `error` -> `<label> failed to load[: <error>]` (error); other states null.
