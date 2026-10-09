# ImageRun

`core/image-server/router/ImageRun.js`

Base class for one in-flight image render. Subclasses: [LocalImageRun](LocalImageRun.md) and [RemoteImageRun](RemoteImageRun.md).

## Methods

- `new ImageRun({ role, send, notify })`; `role` `'image-edit'` words
  notifications as an edit, anything else as a generation.
- `start()` resolves `{ success, images?, error?, aborted? }` and never
  rejects: it calls `_announce()`, then `_launch()` for the adapter handle.
- `abort()` calls the handle's `abort` (always), and when still running sends
  `error { message: 'aborted' }`, notifies `<noun> canceled` and resolves
  `{ success: false, error: 'aborted', aborted: true }`.
- `finished`, `progressLabel` (`Generating image` / `Editing image`),
  `doneLabel` (`Image generated` / `Image edited`), `nounLabel`
  (`Image generation` / `Image edit`).

Subclass contract: implement `_announce()` and `_launch()` (return `{ abort }`
or `null`); optionally `_onSettled()` (runs once) and `_defaultError()`. Use
`_callbacks(onDone)` for `onProgress`, `onDone`, `onError`, which drop events
after the run settled; `_fail(err)` sends `error`, notifies `<noun> failed: <message>`
and resolves the failure; `_finish(result)` settles once.

## Why

The local and remote paths were two near-identical promise blocks in legacy:
the same settle-once guard, abort wording and failure notification. The router
clears its active run only when it is still the same run, so a late settle can
never clear a newer render.
