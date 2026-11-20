# TestTarget

`extensions/model-testing/session/TestTarget.js`

Puts the model picked for a test run behind the chat server and hands back what a suite
needs to reach it.

## Methods

- `new TestTarget({ llmServerService, chatRouter, launcher?, updater? })` (defaults
  `ServerLauncher.shared` and a core `LlmDefaultsUpdater`).
- `resolve(modelPath, noteServer)` resolves `{ livePath, defaults, deps, modelRef, modelLabel }` or `{ error }`:
  - `Pick a downloaded model to test.` with no path and no default model;
  - a path other than the default is saved as the default through the updater (which
    stops a server holding the old model), and the previous default is remembered;
  - a server that is not `ready` is started from the defaults, calling
    `noteServer('starting')` then `'started'`, or `'failed'` with
    `Could not start the chat server: <error>` or `The chat server did not come up (<state>).`;
  - `Browser and extension services are not ready yet.` without `router.getAgentDeps().browserService`;
  - `modelRef` is the first local model's ref, else the router's default ref
    (`No local model is configured to test.` when neither exists).
- `restore()` saves the remembered default back (stopping the server, so the user's next
  chat loads their own model) and forgets it. Nothing happens when the run tested the
  default, or when there was no default before.

## Why

A chat turn can only reach the model the defaults name: `local::<stem>` switches by
saving the default too. Testing another model therefore swaps the default for the run,
the way picking it in Setup would, and puts the old one back so a test never changes
what the user chats with. The swap goes through `LlmDefaultsUpdater` and not a bare
save because a ready server still holding the old model would otherwise be graded as
the new one.
