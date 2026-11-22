# DefaultModelServing

`core/llm-server/ui/js/setup-ui/defaults/DefaultModelServing.js`

What runs the default model, for the Chat defaults card: the runtime that serves it (which gates the Ready pill) and the line under the Model row.

## Methods

- `DefaultModelServing.of(defaults, frameworks, runtimes)` -> `{ runtimeId, runsOn: { text, missing } | null }`. Reads [FrameworkStore](../frameworks/FrameworkStore.md)`.current()` when it is about this very model (`modelPath` equal):
  - served: "Runs on llama.cpp (LumaByte)", `missing: false`;
  - not served, framework known: "Basalt runs this model, and no Basalt build is installed.", `missing: true`;
  - not served, unknown: "No installed framework can run this model.".
  - No default model: no line. No view, or a view about another model: no line, and the runtime main recorded (`defaults.runtimeId`, written by DefaultRuntimeFollower) stands in when it is installed. A view whose `current` is null (the model is not on disk) is believed.
- `runsOnText(frameworkName, buildName)`: a build named after its framework says both alone ("Runs on llama.cpp (LumaByte)"), else "Runs on Basalt (basalt-luma)".
- `missingText(frameworkName)`.

## Why

There is no Runtime picker any more: the model decides the framework, so the card says what that decision is, quietly when it works and plainly when it cannot.
