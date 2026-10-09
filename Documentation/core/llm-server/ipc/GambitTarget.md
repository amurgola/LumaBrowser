# GambitTarget

`core/llm-server/ipc/GambitTarget.js`

Works out what a compatibility gambit grades.

## Methods

- `new GambitTarget({ llmServerService, chatRouter, launcher? })` (default `ServerLauncher.shared`).
- `resolve(modelPath, send)` resolves `{ livePath, defaults, deps, modelRef, modelLabel }` or `{ error }`:
  - `No default model is configured to grade.` without a default model;
  - `That model is not the configured default. Set it as the default model, then run the gambit.`
    when `modelPath` names another model;
  - a server that is not `ready` is started from the defaults, sending
    `server { state: 'starting' }` then `started`, or `failed { error }` with
    `Could not start the chat server: <error>` or `The chat server did not come up (<state>).`;
  - `Browser and extension services are not ready yet.` without `router.getAgentDeps().browserService`;
  - `modelRef` is the first local model's ref, else the router's default ref
    (`No local model is configured to grade.` when neither exists).

## Why

Starting from the configured defaults keeps the guarantee that the gambit grades
the model named above the button. A null ref would throw on the first turn, so
the local model is named explicitly.
