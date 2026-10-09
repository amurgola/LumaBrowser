# ShutdownSequence

`app/shutdown/ShutdownSequence.js`

The orderly shutdown of everything the app owns.

## Methods

- `new ShutdownSequence(ctx, { log? })`.
- `run()`:
  1. stop the artifact-task and scheduled-task schedulers, the trigger runner,
     the folder watches, the page-change and notification sources (each isolated);
  2. `await extensionManager.deactivate()`;
  3. `networkInterceptor.detachAll()`;
  4. the model servers: LLM (`shutdown`, which also unpins its RAM and stops the
     group router), image (`shutdown`), the image RAM pin, music, speech-to-text,
     text-to-speech, grounding, desktop control. LLM, image and music failures
     warn `<service>.shutdown failed:`; the rest are quiet;
  5. sharing host, sharing client, the local API, then `await restGateway.stop()`.

The window is not destroyed here: `app.exit` handles it, and destroying it would
fire `window-all-closed` and re-enter `before-quit`.

## Why

A child left running keeps its VRAM until the OS reaps the orphan. The image RAM
pin is released here, not in `ImageServerService.shutdown`, because that method
is also the chat router's mid-session VRAM reclaim, which must keep the pinned
page cache.
