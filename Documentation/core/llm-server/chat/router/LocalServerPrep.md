# LocalServerPrep

`core/llm-server/chat/router/LocalServerPrep.js`

Gets the managed local server running the model a chat request asked for.

## Methods

- `new LocalServerPrep({ llmServerService, launcher, scanner, imageServerService })`; `imageServerService` is a getter.
- `prepare(wantBasename, imageCount, hooks, log)`: throws `NOT_CONFIGURED` without a runtime and model; a different stem is resolved by scanning `getModelsDirConfig().effectivePath` (first weight's basename) and saved with `setDefaults({ modelPath })`, else `Local model "x" was not found in the models directory.`; then, when `LocalRestartDecision` gives a reason: `hooks.onStatus({ phase: reason })`, `ensureStopped()`, `launcher.resolveAndStart(svc, { withVision })` (a throw becomes a failure). A failed start with an image service: `onStatus({ phase: 'reclaiming-vram' })`, `shutdown()`, stop and start once more. Still failing throws `LaunchErrorHints.errorFrom(result)`. Always ends with `runtimeServer.markActive()`.

## Why

The image servers may hold the cards the LLM needs (a 27B load crashed right after setup art loaded both); they reload on demand. `ensureStopped` force-kills any prior child so the launcher's VRAM reserve sizes against real free space.
